import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/client';
import { useQuery } from '@tanstack/react-query';
import {
  Navigation, ArrowLeft, ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight,
  RotateCw, MapPin, X, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

// ─── Leaflet icon fix ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const buildingIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#14b8a6;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const selectedBuildingIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#14b8a6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(20,184,166,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface Step {
  instruction: string;
  distanceMeters: number;
  distanceLabel: string;
  maneuverType: string;
  maneuverModifier?: string;
  location: [number, number];
}
interface RouteData {
  coords: [number, number][];
  steps: Step[];
  totalDurationLabel: string;
  totalDistanceLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function fmtDur(s: number): string {
  const mins = Math.round(s / 60);
  return mins < 1 ? '< 1 min' : `${mins} min`;
}

function getInstruction(step: any): string {
  const { type, modifier } = step.maneuver;
  const road = step.name ? ` onto ${step.name}` : '';
  switch (type) {
    case 'depart':   return `Head ${modifier || 'forward'}${road}`;
    case 'arrive':   return 'You have arrived';
    case 'turn':
      if (modifier === 'left')        return `Turn left${road}`;
      if (modifier === 'right')       return `Turn right${road}`;
      if (modifier === 'slight left') return `Keep left${road}`;
      if (modifier === 'slight right')return `Keep right${road}`;
      if (modifier === 'sharp left')  return `Turn sharp left${road}`;
      if (modifier === 'sharp right') return `Turn sharp right${road}`;
      if (modifier === 'uturn')       return 'Make a U-turn';
      return `Continue straight${road}`;
    case 'new name':    return `Continue${road}`;
    case 'continue':    return `Continue ${modifier || ''}${road}`.trim();
    case 'roundabout':
    case 'rotary':      return 'Enter the roundabout';
    case 'fork':        return modifier?.includes('left') ? 'Keep left at the fork' : 'Keep right at the fork';
    case 'merge':       return `Merge ${modifier || ''}${road}`.trim();
    case 'end of road': return modifier === 'left' ? `Turn left at the end${road}` : `Turn right at the end${road}`;
    default:            return `Continue${road}`;
  }
}

function haversineMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Map sub-components ───────────────────────────────────────────────────────
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) { done.current = true; map.flyTo(center, 17, { duration: 1 }); }
  }, [center, map]);
  return null;
}

function FitRoute({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) map.fitBounds(L.latLngBounds(coords), { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

function FollowUser({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), 18)); }, [center, map]);
  return null;
}

// ─── Maneuver icon ────────────────────────────────────────────────────────────
function StepIcon({ type, modifier, size = 18 }: { type: string; modifier?: string; size?: number }) {
  const p = { size };
  if (type === 'arrive')                                return <MapPin {...p} />;
  if (type === 'depart')                                return <Navigation {...p} />;
  if (type === 'roundabout' || type === 'rotary')       return <RotateCw {...p} />;
  if (modifier === 'slight left')                       return <ArrowUpLeft {...p} />;
  if (modifier === 'slight right')                      return <ArrowUpRight {...p} />;
  if (modifier === 'left'  || modifier === 'sharp left')  return <ArrowLeft {...p} />;
  if (modifier === 'right' || modifier === 'sharp right') return <ArrowRight {...p} />;
  return <ArrowUp {...p} />;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MapView() {
  const [params] = useSearchParams();
  const targetCode = params.get('target');

  const [userLoc, setUserLoc]           = useState<[number, number] | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [routeData, setRouteData]       = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [navigating, setNavigating]     = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showSteps, setShowSteps]       = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await apiClient.get('buildings/')).data,
  });

  // One-time fix on load
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => console.warn('Geolocation blocked')
    );
  }, []);

  // Live tracking while navigating
  useEffect(() => {
    if (!navigating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => console.warn('Watch failed'),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [navigating]);

  // Auto-advance steps when within 25 m of next waypoint
  useEffect(() => {
    if (!navigating || !userLoc || !routeData) return;
    const steps = routeData.steps;
    if (currentStepIdx >= steps.length - 1) return;
    const dist = haversineMeters(userLoc, steps[currentStepIdx + 1].location);
    if (dist < 25) setCurrentStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }, [userLoc, navigating, routeData, currentStepIdx]);

  // Fetch route (with steps) from OSRM
  useEffect(() => {
    if (!userLoc || !selectedBuilding) { setRouteData(null); return; }
    const [lat1, lng1] = userLoc;
    const lat2 = Number(selectedBuilding.latitude);
    const lng2 = Number(selectedBuilding.longitude);

    setIsLoadingRoute(true);
    fetch(
      `https://router.project-osrm.org/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!data.routes?.[0]) return;
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const steps: Step[] = route.legs.flatMap((leg: any) =>
          leg.steps.map((s: any) => {
            const [sLng, sLat] = s.maneuver.location;
            return {
              instruction: getInstruction(s),
              distanceMeters: s.distance,
              distanceLabel: fmtDist(s.distance),
              maneuverType: s.maneuver.type,
              maneuverModifier: s.maneuver.modifier,
              location: [sLat, sLng] as [number, number],
            };
          })
        );
        setRouteData({
          coords,
          steps,
          totalDurationLabel: fmtDur(route.duration),
          totalDistanceLabel: fmtDist(route.distance),
        });
      })
      .catch(() => console.warn('OSRM routing failed'))
      .finally(() => setIsLoadingRoute(false));
  }, [userLoc, selectedBuilding]);

  // Auto-select from URL param
  useEffect(() => {
    if (buildings && targetCode) {
      const target = buildings.find((b: any) => b.code === targetCode);
      if (target) setSelectedBuilding(target);
    }
  }, [buildings, targetCode]);

  function startNavigation() {
    setCurrentStepIdx(0);
    setShowSteps(false);
    setNavigating(true);
  }

  function stopNavigation() {
    setNavigating(false);
    setCurrentStepIdx(0);
  }

  function clearSelection() {
    stopNavigation();
    setSelectedBuilding(null);
    setRouteData(null);
  }

  const defaultCenter: [number, number] = [5.6037, -0.187];
  const currentStep = routeData?.steps[currentStepIdx];
  const remainingDist = routeData
    ? routeData.steps.slice(currentStepIdx).reduce((s, step) => s + step.distanceMeters, 0)
    : 0;

  return (
    <div className="h-full w-full relative">

      {/* ═══ NAVIGATION BANNER (active navigation) ══════════════════════════ */}
      {navigating && routeData && currentStep && (
        <>
          <div className="absolute top-0 left-0 right-0 z-[1000] bg-brand-500 text-white px-4 pt-safe-top pb-3 shadow-xl"
               style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
            {/* Current instruction */}
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-2xl p-3 flex-shrink-0">
                <StepIcon type={currentStep.maneuverType} modifier={currentStep.maneuverModifier} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold leading-tight">{currentStep.instruction}</p>
                {currentStepIdx < routeData.steps.length - 1 && currentStep.distanceMeters > 0 && (
                  <p className="text-sm text-white/80 mt-0.5">in {currentStep.distanceLabel}</p>
                )}
              </div>
              <button
                onClick={stopNavigation}
                className="bg-white/20 hover:bg-white/30 rounded-xl p-2 flex-shrink-0 transition-colors"
                aria-label="End navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary row */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/20 text-sm text-white/90">
              <span className="font-semibold">{fmtDist(remainingDist)} remaining</span>
              <button
                onClick={() => setShowSteps((s) => !s)}
                className="flex items-center gap-1 font-medium hover:text-white transition-colors"
              >
                {showSteps ? 'Hide steps' : 'All steps'}
                {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Steps list panel */}
          {showSteps && (
            <div className="absolute left-0 right-0 z-[999] bg-white/97 backdrop-blur-md shadow-lg max-h-[40vh] overflow-y-auto"
                 style={{ top: '148px' }}>
              {routeData.steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 ${
                    i === currentStepIdx
                      ? 'bg-brand-50'
                      : i < currentStepIdx
                      ? 'opacity-40'
                      : ''
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${i === currentStepIdx ? 'text-brand-500' : 'text-slate-400'}`}>
                    <StepIcon type={step.maneuverType} modifier={step.maneuverModifier} size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${i === currentStepIdx ? 'text-slate-900' : 'text-slate-600'}`}>
                      {step.instruction}
                    </p>
                    {step.distanceMeters > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{step.distanceLabel}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ PREVIEW PANEL (building selected, not navigating) ══════════════ */}
      {!navigating && selectedBuilding && (
        <div className="absolute bottom-24 left-4 right-4 md:bottom-auto md:left-8 md:top-8 z-[1000] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl w-auto md:w-80 border border-slate-100/50 max-h-[65vh] overflow-y-auto">
          <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">{selectedBuilding.code}</div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-3">{selectedBuilding.name}</h2>

          {selectedBuilding.image_url && (
            <img src={selectedBuilding.image_url} alt={selectedBuilding.name} className="w-full h-32 object-cover rounded-xl mb-4 bg-slate-100" />
          )}

          {/* Route summary */}
          {isLoadingRoute && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
              <Loader2 size={16} className="animate-spin" /> Calculating route…
            </div>
          )}

          {routeData && (
            <>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-slate-700 mb-4">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <Navigation size={18} className="text-brand-500" />
                </div>
                <div>
                  <p className="font-bold">{routeData.totalDurationLabel} walk</p>
                  <p className="text-xs text-slate-500">{routeData.totalDistanceLabel}</p>
                </div>
              </div>

              {/* Steps preview */}
              <div className="mb-4 rounded-xl border border-slate-100 overflow-hidden">
                {routeData.steps.slice(0, 4).map((step, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 bg-white">
                    <span className="text-slate-400 flex-shrink-0">
                      <StepIcon type={step.maneuverType} modifier={step.maneuverModifier} size={14} />
                    </span>
                    <p className="text-xs text-slate-700 flex-1 truncate">{step.instruction}</p>
                    {step.distanceMeters > 0 && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{step.distanceLabel}</span>
                    )}
                  </div>
                ))}
                {routeData.steps.length > 4 && (
                  <div className="px-3 py-2 bg-slate-50 text-xs text-slate-400 text-center">
                    +{routeData.steps.length - 4} more steps
                  </div>
                )}
              </div>
            </>
          )}

          {/* CTA */}
          {routeData && userLoc ? (
            <button
              onClick={startNavigation}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 py-3 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95"
            >
              <Navigation size={18} />
              Start Walking
            </button>
          ) : !isLoadingRoute && (
            <p className="text-xs text-slate-400 text-center">Enable location to get directions</p>
          )}

          <button
            onClick={clearSelection}
            className="w-full mt-3 text-center text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 py-2 rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* ═══ MAP ════════════════════════════════════════════════════════════ */}
      <MapContainer
        center={userLoc || defaultCenter}
        zoom={16}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map behaviour */}
        {!navigating && !routeData && userLoc && <FlyTo center={userLoc} />}
        {!navigating && routeData && <FitRoute coords={routeData.coords} />}
        {navigating && userLoc && <FollowUser center={userLoc} />}

        {/* User dot */}
        {userLoc && <Marker position={userLoc} icon={userIcon} />}

        {/* Building markers */}
        {buildings?.map((b: any) => (
          <Marker
            key={b.id}
            position={[Number(b.latitude), Number(b.longitude)]}
            icon={selectedBuilding?.id === b.id ? selectedBuildingIcon : buildingIcon}
            eventHandlers={{ click: () => { if (!navigating) setSelectedBuilding(b); } }}
          />
        ))}

        {/* Route polyline */}
        {routeData && (
          <Polyline
            positions={routeData.coords}
            pathOptions={{ color: '#14b8a6', weight: 5, opacity: 0.85 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
