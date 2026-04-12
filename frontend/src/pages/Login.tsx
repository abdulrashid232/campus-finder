import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { Compass, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiClient.post('auth/login/', { email, password });
        setAuth(res.data.access, res.data.refresh);
        
        // Fetch user profile immediately
        const userRes = await apiClient.get('auth/profile/', {
          headers: { Authorization: `Bearer ${res.data.access}` }
        });
        setUser(userRes.data);
        
        toast.success("Welcome back!");
        navigate('/');
      } else {
        await apiClient.post('auth/register/', { email, password, username });
        toast.success("Registration successful! Please log in.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/40 p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/40 mb-4 transform -rotate-6">
            <Compass size={36} className="transform rotate-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            ClassFinder Campus
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Sign in to manage your schedule" : "Create your student account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm">@</span>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50"
                  placeholder="johndoe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50"
                placeholder="student@university.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-brand-500/20 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        
        {isLogin && <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
             Login to <b> find your way around campus</b>
        </div>}
      </div>
    </div>
  );
}
