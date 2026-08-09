import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'lucide-react';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
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
  html: `<div style="width:20px;height:20px;background:#14b8a6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(20,184,166,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper component to fly the map view to a new center
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 17, { duration: 1 }); }, [center, map]);
  return null;
}

export default function MapView() {
  const [params] = useSearchParams();
  const targetCode = params.get('target');

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await apiClient.get('buildings/')).data,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn('Geolocation blocked')
      );
    }
  }, []);

  // Fetch walking route from OSRM when both user and building are known
  useEffect(() => {
    if (!userLoc || !selectedBuilding) {
      setRouteCoords(null);
      setRouteInfo(null);
      return;
    }
    const [lat1, lng1] = userLoc;
    const lat2 = Number(selectedBuilding.latitude);
    const lng2 = Number(selectedBuilding.longitude);

    fetch(
      `https://router.project-osrm.org/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRouteCoords(coords);
          const secs = data.routes[0].duration;
          const mins = Math.round(secs / 60);
          const meters = Math.round(data.routes[0].distance);
          setRouteInfo({
            duration: mins < 1 ? '< 1 min' : `${mins} min`,
            distance: meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`,
          });
        }
      })
      .catch(() => console.warn('OSRM routing failed'));
  }, [userLoc, selectedBuilding]);

  // Auto-select building from URL param
  useEffect(() => {
    if (buildings && targetCode) {
      const target = buildings.find((b: any) => b.code === targetCode);
      if (target) setSelectedBuilding(target);
    }
  }, [buildings, targetCode]);

  const defaultCenter: [number, number] = [5.6037, -0.187]; // Accra fallback

  return (
    <div className="h-full w-full relative">
      {/* Floating Info Panel */}
      {selectedBuilding && (
        <div className="absolute bottom-24 left-4 right-4 md:bottom-auto md:left-8 md:top-8 z-[1000] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl w-auto md:w-80 border border-slate-100/50 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">{selectedBuilding.code}</div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">{selectedBuilding.name}</h2>

          {selectedBuilding.image_url && (
            <img src={selectedBuilding.image_url} alt={selectedBuilding.name} className="w-full h-32 object-cover rounded-xl mb-4 bg-slate-100" />
          )}

          {routeInfo && (
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-slate-700 mb-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Navigation size={18} className="text-brand-500" />
              </div>
              <div>
                <div className="font-bold">{routeInfo.duration}</div>
                <div className="text-xs text-slate-500">{routeInfo.distance} walking</div>
              </div>
            </div>
          )}

          <a
            href={
              userLoc
                ? `https://www.google.com/maps/dir/?api=1&origin=${userLoc[0]},${userLoc[1]}&destination=${selectedBuilding.latitude},${selectedBuilding.longitude}`
                : `https://www.google.com/maps/dir/?api=1&destination=${selectedBuilding.latitude},${selectedBuilding.longitude}`
            }
            target="_blank"
            rel="noreferrer"
            className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 py-3 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95"
          >
            <Navigation size={18} />
            Open in Google Maps
          </a>

          <button
            onClick={() => { setSelectedBuilding(null); setRouteCoords(null); setRouteInfo(null); }}
            className="w-full mt-4 text-center text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 py-2 rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

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

        {/* Fly to user when location becomes available */}
        {userLoc && <FlyTo center={userLoc} />}

        {/* User location dot */}
        {userLoc && <Marker position={userLoc} icon={userIcon} />}

        {/* Building markers */}
        {buildings?.map((b: any) => (
          <Marker
            key={b.id}
            position={[Number(b.latitude), Number(b.longitude)]}
            icon={selectedBuilding?.id === b.id ? selectedBuildingIcon : buildingIcon}
            eventHandlers={{ click: () => setSelectedBuilding(b) }}
          />
        ))}

        {/* Walking route polyline */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#14b8a6', weight: 5, opacity: 0.85 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
