import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Search, Building2, MapPin, Navigation, DoorOpen, ImageOff } from 'lucide-react';

interface BuildingT {
  id: number;
  name: string;
  code: string;
  latitude: string;
  longitude: string;
  image_url: string | null;
  image_absolute: string | null;
}

interface RoomT {
  id: number;
  building: BuildingT;
  room_number: string;
  floor: number;
  image_absolute: string | null;
}

export default function Directory() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: buildings, isLoading: loadingBuildings } = useQuery<BuildingT[]>({
    queryKey: ['buildings'],
    queryFn: async () => (await apiClient.get('buildings/')).data,
  });

  const { data: rooms, isLoading: loadingRooms } = useQuery<RoomT[]>({
    queryKey: ['rooms'],
    queryFn: async () => (await apiClient.get('rooms/')).data,
  });

  const roomsByBuilding = useMemo(() => {
    const map = new Map<number, RoomT[]>();
    (rooms || []).forEach((r) => {
      const list = map.get(r.building.id) || [];
      list.push(r);
      map.set(r.building.id, list);
    });
    return map;
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings || [];
    return (buildings || []).filter((b) => {
      if (b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)) return true;
      const roomMatch = (roomsByBuilding.get(b.id) || []).some((r) =>
        r.room_number.toLowerCase().includes(q)
      );
      return roomMatch;
    });
  }, [buildings, roomsByBuilding, query]);

  const goToMap = (buildingCode: string, roomId?: number) => {
    const url = roomId ? `/map?target=${buildingCode}&room=${roomId}` : `/map?target=${buildingCode}`;
    navigate(url);
  };

  const isLoading = loadingBuildings || loadingRooms;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Building2 className="text-brand-500" size={30} /> Directory
        </h1>
        <p className="text-slate-500 mt-2">Browse every building and room mapped on campus.</p>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-brand-500" size={20} />
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm shadow-slate-200/50 focus:ring-2 focus:ring-brand-500 transition-all bg-white text-lg placeholder-slate-400 font-medium"
          placeholder="Filter by building or room (e.g. Oduro, OBFF1, Library)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-3xl bg-white border border-slate-200 border-dashed text-slate-500 p-6 text-center">
          <p className="font-medium">No buildings or rooms match "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((b) => {
            const buildingRooms = roomsByBuilding.get(b.id) || [];
            const cover = b.image_absolute || b.image_url;
            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className="h-40 bg-slate-100 relative">
                  {cover ? (
                    <img src={cover} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageOff size={32} />
                    </div>
                  )}
                  <button
                    onClick={() => goToMap(b.code)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur text-brand-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-white shadow-sm transition-colors"
                  >
                    <Navigation size={14} /> Directions
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">
                    {b.code}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight mb-1">{b.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
                    <MapPin size={12} /> {Number(b.latitude).toFixed(6)}, {Number(b.longitude).toFixed(6)}
                  </p>

                  {buildingRooms.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-2">
                        <DoorOpen size={14} /> {buildingRooms.length} room{buildingRooms.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {buildingRooms.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => goToMap(b.code, r.id)}
                            className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 transition-colors"
                          >
                            {r.image_absolute ? (
                              <img
                                src={r.image_absolute}
                                alt={r.room_number}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                <DoorOpen size={12} className="text-slate-400" />
                              </span>
                            )}
                            <span className="text-xs font-medium text-slate-700 group-hover:text-brand-700">
                              {r.room_number}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
