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
  const [activeTab, setActiveTab] = useState<'profile' | 'household' | 'categories'>('profile');
  
  const { categories, addCategory, deleteCategory } = useBudgetStore();
  const { userPreferences, updatePreferences } = usePreferenceStore();
  const { user, updateUser, updateHouseholdCode, updateMember, removeMember, addMember, updateHouseholdSettings } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [localProfile, setLocalProfile] = useState({ 
    firstName: user?.firstName || '', 
    lastName: user?.lastName || '', 
    email: user?.email || '' 
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Household Settings State
  const [householdName, setHouseholdName] = useState(user?.household?.name || '');
  const [businessEnabled, setBusinessEnabled] = useState(user?.household?.businessEnabled ?? user?.household?.business_enabled ?? true);
  const [businessName, setBusinessName] = useState(user?.household?.businessName ?? user?.household?.business_name ?? 'Little Loom');
  const [shopifyShopUrl, setShopifyShopUrl] = useState(user?.household?.shopifyShopUrl ?? user?.household?.shopify_shop_url ?? '');
  const [shopifyAccessToken, setShopifyAccessToken] = useState(user?.household?.shopifyAccessToken ?? user?.household?.shopify_access_token ?? '');
  const [utilitySplitEnabled, setUtilitySplitEnabled] = useState(user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true);
  const [utilitySplitPartnerId, setUtilitySplitPartnerId] = useState<number | null>(user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id ?? null);
  const [isHouseholdSaving, setIsHouseholdSaving] = useState(false);
  
  // New Member Form State
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor' | 'reader',
    permissions: ['budget', 'utilities']
  });

  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const MODULES = [
    { id: 'budget', label: 'Költségvetés', icon: <Wallet size={14} /> },
    { id: 'utilities', label: 'Rezsi', icon: <Droplets size={14} /> },
    { id: 'business', label: businessEnabled ? businessName : 'Vállalkozás', icon: <ShoppingBag size={14} /> },
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
    if (user?.household) {
      setHouseholdName(user.household.name || '');
      setBusinessEnabled(user.household.businessEnabled ?? user.household.business_enabled ?? true);
      setBusinessName(user.household.businessName ?? user.household.business_name ?? 'Little Loom');
      setShopifyShopUrl(user.household.shopifyShopUrl ?? user.household.shopify_shop_url ?? '');
      setShopifyAccessToken(user.household.shopifyAccessToken ?? user.household.shopify_access_token ?? '');
      setUtilitySplitEnabled(user.household.utilitySplitEnabled ?? user.household.utility_split_enabled ?? true);
      setUtilitySplitPartnerId(user.household.utilitySplitPartnerId ?? user.household.utility_split_partner_id ?? null);
    }
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

  const handleHouseholdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsHouseholdSaving(true);
    
    if (businessEnabled) {
      if (!businessName.trim()) {
        addNotification('A vállalkozás nevét kötelező megadni, ha a modul be van kapcsolva!', 'error');
        setIsHouseholdSaving(false);
        return;
      }
      if (!shopifyShopUrl.trim() || !shopifyAccessToken.trim()) {
        addNotification('A Shopify Shop URL-t és Access Tokent kötelező megadni, ha a modul be van kapcsolva!', 'error');
        setIsHouseholdSaving(false);
        return;
      }
    }
    
    try {
      await updateHouseholdSettings({
        name: householdName,
        business_enabled: businessEnabled,
        business_name: businessName,
        shopify_shop_url: shopifyShopUrl,
        shopify_access_token: shopifyAccessToken,
        utility_split_enabled: utilitySplitEnabled,
        utility_split_partner_id: utilitySplitPartnerId
      });
      addNotification('Háztartás beállítások sikeresen elmentve!', 'success');
    } catch (err) {
      addNotification('Nem sikerült elmenteni a beállításokat.', 'error');
    } finally {
      setIsHouseholdSaving(false);
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
      role: 'editor',
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
           { id: 'categories', label: 'Kategóriák', icon: <FolderTree size={16} /> }
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
              {/* HOUSEHOLD CUSTOM SETTINGS FORM */}
              {isAdmin && (
                <form onSubmit={handleHouseholdSave} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  <h3 className="text-lg font-black text-white mb-2 flex items-center gap-3">
                    <Home size={20} className="text-brand-primary" /> Háztartás testreszabása
                  </h3>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest ml-1">Háztartás Neve</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-primary outline-none transition-all font-medium" 
                      value={householdName} 
                      onChange={e => setHouseholdName(e.target.value)} 
                      placeholder="Pl. Kovács Család" 
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
                    {/* BUSINESS MODULE BOX */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="text-brand-primary" size={22} />
                          <div>
                            <div className="font-black text-sm text-white uppercase tracking-wider">Vállalkozás Modul</div>
                            <div className="text-[0.65rem] text-slate-500 mt-0.5">Shopify webáruház integráció</div>
                          </div>
                        </div>
                        <div 
                          onClick={() => setBusinessEnabled(!businessEnabled)} 
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${businessEnabled ? 'bg-brand-primary shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'bg-slate-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${businessEnabled ? 'right-1' : 'right-[26px]'}`} />
                        </div>
                      </div>

                      {businessEnabled && (
                        <div className="flex flex-col gap-4 mt-2 border-t border-white/5 pt-4 animate-fadeIn">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider ml-1">Vállalkozás Neve</label>
                            <input 
                              type="text" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-brand-primary outline-none transition-all font-medium" 
                              value={businessName} 
                              onChange={e => setBusinessName(e.target.value)} 
                              placeholder="Pl. Little Loom" 
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider ml-1">Shopify Bolt URL (Domain)</label>
                            <input 
                              type="text" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-brand-primary outline-none transition-all font-medium" 
                              value={shopifyShopUrl} 
                              onChange={e => setShopifyShopUrl(e.target.value)} 
                              placeholder="pl. bolt-neve.myshopify.com" 
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider ml-1">Shopify Access Token (Admin API)</label>
                            <div className="relative">
                              <input 
                                type="password" 
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:border-brand-primary outline-none transition-all font-medium" 
                                value={shopifyAccessToken} 
                                onChange={e => setShopifyAccessToken(e.target.value)} 
                                placeholder="shpat_********************************" 
                              />
                              <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* UTILITY SPLIT BOX */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Droplets className="text-brand-primary" size={22} />
                          <div>
                            <div className="font-black text-sm text-white uppercase tracking-wider">Rezsi Megosztás</div>
                            <div className="text-[0.65rem] text-slate-500 mt-0.5">Közös rezsiköltség elszámolása</div>
                          </div>
                        </div>
                        <div 
                          onClick={() => setUtilitySplitEnabled(!utilitySplitEnabled)} 
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${utilitySplitEnabled ? 'bg-brand-primary shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'bg-slate-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${utilitySplitEnabled ? 'right-1' : 'right-[26px]'}`} />
                        </div>
                      </div>

                      {utilitySplitEnabled && (
                        <div className="flex flex-col gap-4 mt-2 border-t border-white/5 pt-4 animate-fadeIn">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider ml-1">Költségmegosztási Partner</label>
                            {(() => {
                              const partners = user?.household?.users?.filter(u => u.id !== user.id) || [];
                              if (partners.length === 0) {
                                return (
                                  <div className="text-[0.7rem] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 leading-relaxed">
                                    ⚠️ Nincs más tag a háztartásban! A rezsi megosztásához először hívjon meg vagy vegyen fel egy családtagot az alábbi űrlapon.
                                  </div>
                                );
                              }
                              return (
                                <select 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-brand-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                                  value={utilitySplitPartnerId || ''} 
                                  onChange={e => setUtilitySplitPartnerId(e.target.value ? Number(e.target.value) : null)}
                                >
                                  <option value="" className="bg-slate-900 font-bold">Válassz partnert...</option>
                                  {partners.map(p => (
                                    <option key={p.id} value={p.id} className="bg-slate-900 font-bold">
                                      {p.firstName} {p.lastName} ({p.email})
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isHouseholdSaving}
                    className="w-full md:w-auto self-end bg-brand-primary hover:bg-brand-light text-white font-black py-3.5 px-10 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    <Save size={18} /> {isHouseholdSaving ? 'Mentés...' : 'Háztartási Beállítások Mentése'}
                  </button>
                </form>
              )}

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
                                       <select 
                                         value={member.role || 'editor'}
                                         onChange={async (e) => await updateMember(member.id, { role: e.target.value as any })}
                                         className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-black outline-none focus:border-brand-primary cursor-pointer appearance-none text-center"
                                       >
                                         <option value="admin" className="bg-slate-900 font-bold text-brand-primary">Adminisztrátor</option>
                                         <option value="editor" className="bg-slate-900 font-bold text-green-500">Szerkesztő</option>
                                         <option value="reader" className="bg-slate-900 font-bold text-slate-400">Olvasó</option>
                                       </select>
                                       <button 
                                         onClick={() => removeMember(member.id)}
                                         className="p-2.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                       >
                                          <Trash2 size={18} />
                                       </button>
                                    </>
                                  )}
                                  {(!isAdmin || member.id === user.id) && (
                                    <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">
                                       {member.role === 'admin' ? 'Adminisztrátor' : member.role === 'editor' ? 'Szerkesztő' : member.role === 'reader' ? 'Olvasó' : 'Családtag'}
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
                             <option value="editor" className="bg-slate-900">Szerkesztő (szerkeszthet, hozzáadhat)</option>
                             <option value="reader" className="bg-slate-900">Olvasó (csak megtekinthet)</option>
                             <option value="admin" className="bg-slate-900">Adminisztrátor (teljes hozzáférés)</option>
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

         
      </div>
    </div>
  );
}
