'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/api';
import { Mail, Lock, Rocket, User, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password_confirmation: '',
    householdName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('A két jelszó nem egyezik.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        household_name: formData.householdName
      });
      
      if (res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
        router.push('/');
      }
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const msg = apiErr.response?.data?.message || 'Hiba történt a regisztráció során. Ellenőrizd az adatokat!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans selection:bg-brand-primary/30 py-12">
      
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>

      <div className="w-full max-w-lg px-6 relative z-10">
        
        {/* LOGO SECTION */}
        <div className="flex flex-col items-center mb-8">
           <Link href="/login" className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(124,106,247,0.4)] mb-4 hover:scale-105 transition-transform duration-300">
              <Rocket size={32} className="text-white" />
           </Link>
           <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">
             Pénz<span className="text-brand-primary italic">Pilot</span> Csatlakozás
           </h1>
           <p className="text-slate-500 text-[0.6rem] font-black uppercase tracking-[0.3em]">Hívd meg a családtagodat</p>
        </div>

        {/* REGISTER CARD */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
           
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-secondary/50 to-transparent"></div>

           <div className="mb-8">
              <h2 className="text-xl font-black text-white mb-2 text-center md:text-left">Fiók létrehozása</h2>
              <p className="text-slate-400 text-sm text-center md:text-left">Add meg az adataidat és a kapott meghívó kódot.</p>
           </div>

           {error && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3 animate-shake">
                <span>⚠️</span> {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Keresztnév</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-brand-primary outline-none transition-all"
                      placeholder="Dani"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Vezetéknév</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-brand-primary outline-none transition-all"
                      placeholder="K."
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail cím</label>
                 <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-brand-primary transition-all"
                      placeholder="nev@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Jelszó</label>
                    <input 
                      type="password" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-brand-primary outline-none transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Megerősítés</label>
                    <input 
                      type="password" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-brand-primary outline-none transition-all"
                      placeholder="••••••••"
                      value={formData.password_confirmation}
                      onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-1.5 pt-2">
                 <label className="text-[0.6rem] font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Háztartás Neve (Pl. Kovács Család)</label>
                 <div className="relative group">
                    <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/50 group-focus-within:text-brand-secondary transition-colors" />
                    <input 
                      type="text" 
                      className="w-full bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl py-4 pl-12 pr-4 text-brand-secondary text-sm font-black tracking-wide outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/50 transition-all placeholder:text-brand-secondary/20"
                      placeholder="Kovács Család"
                      value={formData.householdName}
                      onChange={e => setFormData({...formData, householdName: e.target.value})}
                      required
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:to-brand-primary text-white font-black py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
              >
                {loading ? <RefreshCw size={20} className="animate-spin" /> : <span>Fiók Létrehozása</span>}
              </button>
           </form>

           <div className="mt-8 text-center">
              <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                 <ArrowLeft size={14} /> Vissza a bejelentkezéshez
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
