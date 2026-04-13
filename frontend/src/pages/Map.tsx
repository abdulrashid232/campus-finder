import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import apiClient from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { Navigation, Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 37.7749, // fallback
  lng: -122.4194
};

export default function MapView() {
  const [params] = useSearchParams();
  const targetCode = params.get('target');
  
  const [userLoc, setUserLoc] = useState<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await apiClient.get('buildings/')).data
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => console.warn("Geolocation blocked")
      );
    }
  }, []);

  const calculateRoute = useCallback(() => {
    if (!userLoc || !selectedBuilding || !isLoaded) return;
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: userLoc,
        destination: { lat: Number(selectedBuilding.latitude), lng: Number(selectedBuilding.longitude) },
        travelMode: window.google.maps.TravelMode.WALKING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      }
    );
  }, [userLoc, selectedBuilding, isLoaded]);

  // Handle URL target
  useEffect(() => {
    if (buildings && targetCode) {
      const target = buildings.find((b: any) => b.code === targetCode);
      if (target) {
        setSelectedBuilding(target);
      }
    }
  }, [buildings, targetCode]);

  // Calculate route when selected updates
  useEffect(() => {
    if (selectedBuilding && userLoc) {
      calculateRoute();
    } else {
      setDirections(null);
    }
  }, [selectedBuilding, userLoc, calculateRoute]);

  if (!isLoaded) return <div className="h-full flex items-center justify-center bg-slate-50 text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading Map...</div>;

  return (
    <div className="h-full w-full relative">
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm w-11/12 md:w-auto text-center">
          Warning: Google Maps API key is missing. Map may not load properly.
        </div>
      )}

      {/* Floating Info Panel */}
      {selectedBuilding && (
        <div className="absolute bottom-24 left-4 right-4 md:bottom-auto md:left-8 md:top-8 z-10 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl w-auto md:w-80 border border-slate-100/50 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">{selectedBuilding.code}</div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">{selectedBuilding.name}</h2>
          
          {selectedBuilding.image_url && (
            <img src={selectedBuilding.image_url} alt={selectedBuilding.name} className="w-full h-32 object-cover rounded-xl mb-4 bg-slate-100" />
          )}

          {directions && directions.routes[0] && (
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-slate-700">
               <div className="bg-white p-2 rounded-full shadow-sm"><Navigation size={18} className="text-brand-500" /></div>
               <div>
                 <div className="font-bold">{directions.routes[0].legs[0].duration.text}</div>
                 <div className="text-xs text-slate-500">{directions.routes[0].legs[0].distance.text} walking</div>
               </div>
            </div>
          )}

          <a
            href={userLoc ? `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${selectedBuilding.latitude},${selectedBuilding.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${selectedBuilding.latitude},${selectedBuilding.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 py-3 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95"
          >
            <Navigation size={18} />
            Open in Google Maps
          </a>

          <button 
            onClick={() => { setSelectedBuilding(null); setDirections(null); }}
            className="w-full mt-4 text-center text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 py-2 rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLoc || defaultCenter}
        zoom={16}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            // Simplified custom style for cleaner look
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        {userLoc && (
          <Marker 
             position={userLoc} 
             icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }}
          />
        )}
        
        {buildings?.map((b: any) => (
          <Marker
            key={b.id}
            position={{ lat: Number(b.latitude), lng: Number(b.longitude) }}
            onClick={() => setSelectedBuilding(b)}
            icon={{ path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: '#14b8a6', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }}
          />
        ))}

        {directions && (
          <DirectionsRenderer 
            directions={directions} 
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#14b8a6',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
