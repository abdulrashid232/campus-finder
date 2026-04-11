import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Search as SearchIcon, Navigation, MapPin, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await apiClient.get(`search/?query=${debouncedQuery}`);
      return res.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  // Fetch today's schedule
  const { data: todayClasses, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      const res = await apiClient.get('timetable/');
      return res.data;
    }
  });

  // Highlight next class logic
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDay = now.getDay() - 1; // 0 = Monday in our backend models

  const upcomingClasses = todayClasses?.filter((cls: any) => {
    if (cls.day_of_week !== todayDay) return false;
    const [h, m] = cls.start_time.split(':').map(Number);
    const startMinutes = h * 60 + m;
    return startMinutes >= currentMinutes - 15; // include classes that started 15 mins ago
  }).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

  const nextClass = upcomingClasses && upcomingClasses.length > 0 ? upcomingClasses[0] : null;

  const navigateToLocation = (buildingCode: string) => {
    navigate(`/map?target=${buildingCode}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Good Morning! ☕</h1>
        <p className="text-slate-500 mt-2">Here is your campus overview for today.</p>
      </header>

      {/* Global Search */}
      <section className="relative z-20">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="text-brand-500" size={20} />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm shadow-slate-200/50 focus:ring-2 focus:ring-brand-500 transition-all bg-white text-lg placeholder-slate-400 font-medium"
            placeholder="Search for courses, rooms, or buildings (e.g. CS101, ENG)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {debouncedQuery && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {isSearching ? (
              <div className="p-6 text-center text-slate-500">Searching...</div>
            ) : searchResults?.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {searchResults.map((course: any) => (
                  <li key={course.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{course.course_code}</div>
                        <div className="text-sm text-slate-500">{course.name}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-slate-500">No results found for "{debouncedQuery}"</div>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Next Class Hero Card */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-brand-500" /> Up Next
          </h2>
          
          {isLoadingSchedule ? (
            <div className="h-48 rounded-3xl bg-slate-100 animate-pulse"></div>
          ) : nextClass ? (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white p-8 shadow-xl shadow-brand-500/20 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-md mb-4 border border-white/20">
                    Starts at {nextClass.start_time.substring(0, 5)}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mb-2">
                    {nextClass.course_detail.course_code}
                  </h3>
                  <p className="text-brand-100 font-medium flex items-center gap-2 text-lg">
                    <MapPin size={18} /> {nextClass.room_detail.building.name}, Room {nextClass.room_detail.room_number}
                  </p>
                </div>
                
                <button 
                  onClick={() => navigateToLocation(nextClass.room_detail.building.code)}
                  className="bg-white text-brand-600 px-6 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  <Navigation size={20} />
                  Get Directions
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-3xl bg-white border border-slate-200 border-dashed text-slate-500 p-6 text-center">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                <AlertCircle size={24} />
              </div>
              <p className="font-medium">No more classes today!</p>
              <p className="text-sm mt-1">Enjoy your free time or preview tomorrow's schedule.</p>
            </div>
          )}
        </section>

        {/* Quick Links / Status */}
        <section className="lg:col-span-1">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Stats</h2>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><BookOpen size={20} /></div>
                <span className="font-medium text-slate-700">Total Classes</span>
              </div>
              <span className="font-bold text-xl text-slate-900">{todayClasses?.length || 0}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
