import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Plus, Trash2, MapPin, Navigation } from 'lucide-react';
import AddClassModal from '../components/AddClassModal';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Timetable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: timetable, isLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => (await apiClient.get('timetable/')).data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await apiClient.delete(`timetable/${id}/`),
    onSuccess: () => {
      toast.success("Class removed");
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    }
  });

  if (isLoading) return <div className="p-8">Loading timetable...</div>;

  const entriesByDay = DAYS.map((day, index) => {
    return {
      dayName: day,
      entries: timetable?.filter((t: any) => t.day_of_week === index).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)) || []
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Timetable</h1>
          <p className="text-slate-500 mt-2">Manage your weekly class schedule</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 text-white px-5 py-3 rounded-xl font-medium shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add Class
        </button>
      </header>

      <div className="grid grid-flow-col auto-cols-fr gap-4 overflow-x-auto pb-4">
        {entriesByDay.filter(d => d.entries.length > 0 || d.dayName !== 'Sunday' && d.dayName !== 'Saturday').map((col) => (
          <div key={col.dayName} className="min-w-[280px]">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm mb-4 pb-2 border-b border-slate-200">
              {col.dayName}
            </h3>
            
            <div className="space-y-4">
              {col.entries.map((entry: any) => (
                <div key={entry.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative group hover:border-brand-200 transition-colors">
                  <button 
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="text-brand-500 font-medium text-sm mb-2">
                    {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">{entry.course_detail.course_code}</h4>
                  <div className="text-slate-500 text-sm truncate">{entry.course_detail.name}</div>
                  
                  {entry.room_detail && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => navigate(`/map?target=${entry.room_detail.building.code}`)}
                        className="w-full flex items-center justify-between gap-2 text-sm text-slate-600 hover:text-brand-600 hover:bg-brand-50 font-medium bg-slate-50 p-2 rounded-lg transition-colors group/btn"
                      >
                       <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-brand-400 group-hover/btn:text-brand-600" />
                        {entry.room_detail.building.code} {entry.room_detail.room_number}
                       </div>
                       <Navigation size={14} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {col.entries.length === 0 && (
                 <div className="text-center p-8 bg-slate-50/50 rounded-2xl text-slate-400 text-sm border border-slate-100 border-dashed">
                    No classes
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AddClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
