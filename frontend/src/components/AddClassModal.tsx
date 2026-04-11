import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { X, Save, Clock, MapPin, BookOpen, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AddClassModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [day, setDay] = useState('0');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:30');
  
  // New Course state
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await apiClient.get('courses/')).data
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => (await apiClient.get('rooms/')).data
  });

  const mutation = useMutation({
    mutationFn: async (newClass: any) => await apiClient.post('timetable/', newClass),
    onSuccess: () => {
      toast.success("Class added to timetable!");
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      // Reset generic fields conditionally
      setIsNewCourse(false);
      setNewCourseCode('');
      setNewCourseName('');
      onClose();
    },
    onError: (err) => {
      toast.error("Failed to add class.");
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    let finalCourseId = courseId;

    if (isNewCourse) {
      if (!newCourseCode || !newCourseName) return toast.error("Please fill course details");
      try {
        const res = await apiClient.post('courses/', {
          course_code: newCourseCode.toUpperCase(),
          name: newCourseName
        });
        finalCourseId = res.data.id;
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } catch (err: any) {
        return toast.error(err.response?.data?.course_code?.[0] || "Failed to create new course");
      }
    } else {
      if (!finalCourseId) return toast.error("Please select a course");
    }
    
    mutation.mutate({
      course: finalCourseId,
      room: roomId || null,
      day_of_week: parseInt(day),
      start_time: start,
      end_time: end
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add to Timetable</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2"><BookOpen size={16} /> Course</span>
              <button 
                type="button" 
                onClick={() => setIsNewCourse(!isNewCourse)}
                className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 text-xs"
              >
                <PlusCircle size={14} />
                {isNewCourse ? "Select Existing" : "Add New Course"}
              </button>
            </label>
            
            {isNewCourse ? (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <input
                  type="text"
                  placeholder="Code (e.g. CS101)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none uppercase"
                  required
                />
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                required={!isNewCourse}
              >
                <option value="">Select a course...</option>
                {courses?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <MapPin size={16} /> Room (Optional)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Not decided</option>
              {rooms?.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.building?.code} {r.room_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Clock size={16} /> Start Time
              </label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-brand-500/20"
            >
              <Save size={18} />
              {mutation.isPending ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
