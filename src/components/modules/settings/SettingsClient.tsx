'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { 
  User, Home, FolderTree, Settings, Mail, Shield, CheckCircle, 
  Clock, Trash2, Plus, Bell, Globe, Users, Key, Save, Edit3, X,
  ShoppingBag, Wallet, Droplets, Gauge, AlertCircle, ShieldAlert,
  UserPlus, Lock
} from 'lucide-react';

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<'profile' | 'household' | 'categories' | 'system'>('profile');
  
  const { categories, addCategory, deleteCategory } = useBudgetStore();
  const { userPreferences, updatePreferences } = usePreferenceStore();
  const { user, updateUser, updateHouseholdCode, updateMember, removeMember, addMember } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [localProfile, setLocalProfile] = useState({ 
    firstName: user?.firstName || '', 
    lastName: user?.lastName || '', 
    email: user?.email || '' 
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  
  // New Member Form State
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'member' as 'admin' | 'member',
    permissions: ['budget', 'utilities']
  });

  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const MODULES = [
    { id: 'budget', label: 'Költségvetés', icon: <Wallet size={14} /> },
    { id: 'utilities', label: 'Rezsi', icon: <Droplets size={14} /> },
    { id: 'business', label: 'Little Loom', icon: <ShoppingBag size={14} /> },
    { id: 'meters', label: 'Mérőórák', icon: <Gauge size={14} /> },
    { id: 'debts', label: 'Tartozások', icon: <AlertCircle size={14} /> },
    { id: 'savings', label: 'Megtakarítások', icon: <Shield size={14} /> }
  ];

  React.useEffect(() => {
    setLocalProfile({ 
      firstName: user?.firstName || '', 
      lastName: user?.lastName || '', 
      email: user?.email || '' 
    });
  }, [user]);

  const isAdmin = user?.role === 'admin';

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(localProfile);
      addNotification('Profil sikeresen mentve!', 'success');
    } catch (err) {
      addNotification('Sikertelen mentés.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addNotification('A jelszónak legalább 8 karakterből kell állnia!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification('A két jelszó nem egyezik meg!', 'error');
      return;
    }
    setIsPasswordSaving(true);
    try {
      await updateUser({ password: newPassword, password_confirmation: confirmPassword } as any);
      setNewPassword('');
      setConfirmPassword('');
      addNotification('Jelszó sikeresen megváltoztatva!', 'success');
    } catch (err) {
      addNotification('Nem sikerült megváltoztatni a jelszót.', 'error');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.email || !newMemberData.password || !newMemberData.firstName) {
      addNotification('Kérlek tölts ki minden kötelező mezőt!', 'error');
      return;
    }
    
    await addMember({
      first_name: newMemberData.firstName,
      last_name: newMemberData.lastName,
      email: newMemberData.email,
      password: newMemberData.password,
      role: newMemberData.role,
      permissions: newMemberData.permissions
    });

    setNewMemberData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'member',
      permissions: ['budget', 'utilities']
    });
  };

  const toggleMemberPermission = async (memberId: number, moduleId: string) => {
    const member = user?.household?.users?.find(u => u.id === memberId);
    if (!member) return;

    const currentPermissions = member.permissions || MODULES.map(m => m.id);
    const newPermissions = currentPermissions.includes(moduleId)
      ? currentPermissions.filter(p => p !== moduleId)
      : [...currentPermissions, moduleId];
    
    await updateMember(memberId, { permissions: newPermissions });
  };

  const toggleMemberRole = async (memberId: number) => {
    const member = user?.household?.users?.find(u => u.id === memberId);
    if (!member) return;
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    await updateMember(memberId, { role: newRole });
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-20">
      
      <div>
        <h1 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3 text-white">
          <Settings size={28} className="text-brand-primary" /> Beállítások
        </h1>
        <p className="text-slate-400 text-sm md:text-base">Alkalmazás testreszabása és családtagok kezelése</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
         {[
           { id: 'profile', label: 'Profilom', icon: <User size={16} /> },
           { id: 'household', label: 'Háztartás', icon: <Home size={16} /> },
           { id: 'categories', label: 'Kategóriák', icon: <FolderTree size={16} /> },
           { id: 'system', label: 'Rendszer', icon: <Settings size={16} /> }
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)} 
             className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
               ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-lg' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}
             `}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      <div className="min-h-[400px]">
         {/* PROFILE TAB */}
         {activeTab === 'profile' && (
           <div className="flex flex-col gap-8">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                <User size={18} className="text-brand-primary" /> Személyes adatok
              </h3>
              <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Keresztnév</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all" value={localProfile.firstName} onChange={e => setLocalProfile({...localProfile, firstName: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Vezetéknév</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all" value={localProfile.lastName} onChange={e => setLocalProfile({...localProfile, lastName: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail cím</label>
                     <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all" value={localProfile.email} onChange={e => setLocalProfile({...localProfile, email: e.target.value})} />
                  </div>
                 <button type="submit" className="mt-4 bg-brand-primary hover:bg-brand-light text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 self-start" disabled={isSaving}>
                    {isSaving ? 'Feldolgozás...' : 'Módosítások Mentése'}
                 </button>
              </form>
           </div>

           <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                <Key size={18} className="text-brand-primary" /> Jelszó megváltoztatása
              </h3>
              <form onSubmit={handlePasswordSave} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Új jelszó</label>
                        <input type="password" placeholder="********" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Új jelszó megerősítése</label>
                        <input type="password" placeholder="********" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                     </div>
                  </div>
                 <button type="submit" className="mt-4 bg-brand-primary hover:bg-brand-light text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 self-start" disabled={isPasswordSaving}>
                    {isPasswordSaving ? 'Feldolgozás...' : 'Jelszó frissítése'}
                 </button>
              </form>
           </div>
         </div>
         )}

         {/* HOUSEHOLD TAB */}
         {activeTab === 'household' && (
           <div className="flex flex-col gap-8">
              {/* MEMBERS LIST */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
                 <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                   <Users size={20} className="text-brand-primary" /> Aktív Tagok és Jogosultságok
                 </h3>
                 
                 <div className="flex flex-col gap-6">
                    {user?.household?.users?.map(member => {
                       const memberPermissions = member.permissions || [];
                       const isMemberAdmin = member.role === 'admin';
                       
                       return (
                         <div key={member.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 group transition-all hover:border-white/10">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                               {/* User Identity */}
                               <div className="flex items-center gap-4 min-w-[200px]">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary font-black border border-brand-primary/20 text-lg uppercase">
                                     {member.firstName?.[0] || '?'}{member.lastName?.[0] || '?'}
                                  </div>
                                  <div>
                                     <div className="font-black text-white flex items-center gap-2">
                                        {member.firstName} {member.lastName}
                                        {isMemberAdmin && <ShieldAlert size={14} className="text-brand-primary" />}
                                        {member.id === user.id && <span className="text-[0.55rem] font-black bg-white/10 text-slate-500 px-2 py-0.5 rounded-full uppercase">Én</span>}
                                     </div>
                                     <div className="text-xs text-slate-500 font-medium">{member.email}</div>
                                  </div>
                               </div>

                               {/* Permissions Selector */}
                               <div className="flex-1">
                                  <div className="text-[0.6rem] font-black text-slate-600 uppercase tracking-widest mb-3 ml-1">Hozzáférés a modulokhoz</div>
                                  <div className="flex flex-wrap gap-2">
                                     {MODULES.map(mod => {
                                        const hasAccess = memberPermissions.includes(mod.id);
                                        return (
                                          <button
                                            key={mod.id}
                                            disabled={!isAdmin || member.id === user.id}
                                            onClick={() => toggleMemberPermission(member.id, mod.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[0.65rem] font-black transition-all border
                                              ${hasAccess 
                                                ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[0_0_15px_-5px_rgba(124,106,247,0.4)]' 
                                                : 'bg-white/5 border-white/5 text-slate-600 hover:bg-white/10'}
                                              ${(!isAdmin || member.id === user.id) ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                                            `}
                                          >
                                            {mod.icon} {mod.label}
                                          </button>
                                        );
                                     })}
                                  </div>
                               </div>

                               {/* Role & Actions */}
                               <div className="flex items-center gap-3 lg:border-l lg:border-white/5 lg:pl-6">
                                  {isAdmin && member.id !== user.id && (
                                    <>
                                       <button 
                                         onClick={() => toggleMemberRole(member.id)}
                                         className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all
                                           ${isMemberAdmin ? 'bg-brand-primary text-white' : 'bg-white/5 text-slate-500 hover:text-white'}
                                         `}
                                       >
                                          {isMemberAdmin ? 'Admin' : 'Tag'}
                                       </button>
                                       <button 
                                         onClick={() => removeMember(member.id)}
                                         className="p-2.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                       >
                                          <Trash2 size={18} />
                                       </button>
                                    </>
                                  )}
                                  {!isAdmin && (
                                    <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">
                                       {isMemberAdmin ? 'Adminisztrátor' : 'Családtag'}
                                    </span>
                                  )}
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>

              {/* ADD MEMBER FORM (Admin Only) */}
              {isAdmin && (
                <form onSubmit={handleAddMember} className="bg-slate-900/50 backdrop-blur-xl border border-brand-primary/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                     <UserPlus size={20} className="text-brand-primary" /> Új családtag regisztrálása
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <div className="space-y-2">
                         <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Keresztnév</label>
                         <input 
                           type="text" 
                           placeholder="Ildi"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white text-sm outline-none focus:border-brand-primary transition-all font-medium"
                           value={newMemberData.firstName}
                           onChange={e => setNewMemberData({...newMemberData, firstName: e.target.value})}
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Vezetéknév</label>
                         <input 
                           type="text" 
                           placeholder="Kovács"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white text-sm outline-none focus:border-brand-primary transition-all font-medium"
                           value={newMemberData.lastName}
                           onChange={e => setNewMemberData({...newMemberData, lastName: e.target.value})}
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail cím</label>
                         <input 
                           type="email" 
                           placeholder="ildi@example.com"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white text-sm outline-none focus:border-brand-primary transition-all font-medium"
                           value={newMemberData.email}
                           onChange={e => setNewMemberData({...newMemberData, email: e.target.value})}
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Ideiglenes Jelszó</label>
                         <div className="relative">
                            <input 
                              type="password" 
                              placeholder="********"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-5 pr-10 text-white text-sm outline-none focus:border-brand-primary transition-all font-medium"
                              value={newMemberData.password}
                              onChange={e => setNewMemberData({...newMemberData, password: e.target.value})}
                              required
                            />
                            <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1">Szerepkör</label>
                         <select 
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white text-sm outline-none focus:border-brand-primary transition-all font-bold appearance-none cursor-pointer"
                           value={newMemberData.role}
                           onChange={e => setNewMemberData({...newMemberData, role: e.target.value as any})}
                         >
                            <option value="member" className="bg-slate-900">Tag (Sima felhasználó)</option>
                            <option value="admin" className="bg-slate-900">Adminisztrátor</option>
                         </select>
                      </div>
                   </div>

                   <div className="mb-8">
                      <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Alapértelmezett Jogosultságok</label>
                      <div className="flex flex-wrap gap-2">
                         {MODULES.map(mod => (
                           <button
                             key={mod.id}
                             type="button"
                             onClick={() => {
                               const current = newMemberData.permissions;
                               const updated = current.includes(mod.id) 
                                 ? current.filter(p => p !== mod.id) 
                                 : [...current, mod.id];
                               setNewMemberData({...newMemberData, permissions: updated});
                             }}
                             className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[0.65rem] font-black transition-all border
                               ${newMemberData.permissions.includes(mod.id) 
                                 ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[0_0_15px_-5px_rgba(124,106,247,0.4)]' 
                                 : 'bg-white/5 border-white/5 text-slate-600 hover:bg-white/10'}
                             `}
                           >
                             {mod.icon} {mod.label}
                           </button>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className="w-full md:w-auto bg-brand-primary hover:bg-brand-light text-white font-black py-4 px-12 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
                      <UserPlus size={20} /> Fiók Létrehozása
                   </button>
                </form>
              )}
           </div>
         )}

         {/* CATEGORIES TAB */}
         {activeTab === 'categories' && (
           <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-white">
                <FolderTree size={20} className="text-brand-primary" /> Kategóriák kezelése
              </h3>
              <div className="flex gap-3 mb-8">
                 <input 
                   type="text" 
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-primary outline-none transition-all font-medium" 
                   value={newCat} 
                   onChange={e => setNewCat(e.target.value)} 
                   placeholder="Új kategória neve..." 
                 />
                 <button 
                   className="bg-brand-primary hover:bg-brand-light text-white font-black px-6 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-lg active:scale-95" 
                   onClick={() => { if(newCat) { addCategory(newCat); setNewCat(''); } }}
                 >
                   <Plus size={24} />
                 </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {categories.map(cat => (
                   <div key={cat} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-black text-slate-300 flex justify-between items-center group hover:bg-white/10 transition-all">
                      <span className="truncate pr-2 uppercase tracking-tighter">{cat}</span>
                      <button 
                        onClick={() => deleteCategory(cat)} 
                        className="text-red-500/80 hover:text-red-500 opacity-100 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {/* SYSTEM TAB */}
         {activeTab === 'system' && (
           <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-white">
                 <Shield size={20} className="text-brand-primary" /> Rendszer Preferenciák
              </h3>
              <div className="flex flex-col gap-6">
                 <div className="flex flex-wrap justify-between items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                          <Globe size={24} />
                       </div>
                       <div>
                          <div className="font-black text-sm text-white uppercase tracking-widest">Elsődleges pénznem</div>
                          <div className="text-xs text-slate-500 mt-1 font-medium">Jelenleg: {userPreferences.currency}</div>
                       </div>
                    </div>
                    <select 
                      className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-black focus:outline-none focus:border-brand-primary appearance-none min-w-[100px] text-center" 
                      value={userPreferences.currency} 
                      onChange={e => updatePreferences({ currency: e.target.value })}
                    >
                       <option value="HUF" className="bg-slate-900 font-bold">HUF</option>
                       <option value="EUR" className="bg-slate-900 font-bold">EUR</option>
                       <option value="USD" className="bg-slate-900 font-bold">USD</option>
                    </select>
                 </div>
                 
                 <div className="flex flex-wrap justify-between items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                          <Bell size={24} />
                       </div>
                       <div className="font-black text-sm text-white uppercase tracking-widest">Push Értesítések</div>
                    </div>
                    <div 
                      onClick={() => updatePreferences({ notificationsEnabled: !userPreferences.notificationsEnabled })} 
                      className={`w-14 h-7 rounded-full relative cursor-pointer transition-all duration-300
                        ${userPreferences.notificationsEnabled ? 'bg-brand-primary shadow-[0_0_15px_rgba(124,106,247,0.5)]' : 'bg-slate-700'}
                      `}
                    >
                       <div 
                         className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm
                           ${userPreferences.notificationsEnabled ? 'right-1' : 'right-[30px]'}
                         `} 
                       />
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
