'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Mail, Lock, Rocket, ShieldCheck, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      if (res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
        router.push('/');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 422) {
        setError('Hibás felhasználónév vagy jelszó.');
      } else {
        setError('Hiba történt a bejelentkezés során.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans selection:bg-brand-primary/30">
      
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md px-6 relative z-10">
        
        {/* LOGO SECTION */}
        <div className="flex flex-col items-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center shadow-[0_0_50px_-12px_rgba(124,106,247,0.5)] mb-6 group transition-transform hover:scale-110 duration-500">
              <Rocket size={40} className="text-white group-hover:rotate-12 transition-transform" />
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">
             Pénz<span className="text-brand-primary italic">Pilot</span>
           </h1>
           <p className="text-slate-400 text-[0.65rem] font-black uppercase tracking-[0.4em] ml-1">Intelligens Háztartáskezelő</p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
           
           {/* GLOWING BORDER ACCENT */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent"></div>

           <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-black text-white mb-2">Üdvözlünk újra!</h2>
              <p className="text-slate-400 text-sm">Lépj be a vezérlőterembe az adatok kezeléséhez.</p>
           </div>

           {error && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3 animate-shake">
                <span className="text-lg">⚠️</span> {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail cím</label>
                 <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all placeholder:text-slate-600 font-medium"
                      placeholder="nev@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Jelszó</label>
                 <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                      type="password" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all placeholder:text-slate-600 font-medium"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:to-brand-primary text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(124,106,247,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden mt-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Bejelentkezés</span>
                    <RefreshCw size={18} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </>
                )}
              </button>
           </form>

           <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">
                 <ShieldCheck size={14} className="text-brand-secondary" />
                 Privát családi rendszer
              </div>
              <div className="text-[0.6rem] font-bold text-slate-600 italic">
                 Új tagokat csak az Adminisztrátor vehet fel
              </div>
           </div>
        </div>

        {/* FOOTER */}
        <p className="text-center mt-10 text-[0.6rem] font-black text-slate-700 uppercase tracking-[0.4em]">
          PénzPilot Engine v2.0 • {new Date().getFullYear()}
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
