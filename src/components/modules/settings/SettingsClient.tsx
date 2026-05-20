'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  User,
  Home,
  FolderTree,
  Shield,
  Trash2,
  Plus,
  Key,
  Save,
  ShoppingBag,
  Wallet,
  Droplets,
  Gauge,
  ShieldAlert,
  UserPlus,
  Lock,
  TrendingDown,
  AlertTriangle,
  Handshake,
} from 'lucide-react';
import { SiShopify } from 'react-icons/si';
import { BusinessOptionsEditor } from '@/components/modules/settings/BusinessOptionsEditor';
import { UtilityTemplatesEditor } from '@/components/modules/settings/UtilityTemplatesEditor';
import { resolveUtilityTemplates, type UtilityTemplate } from '@/lib/utilityTemplates';
import {
  resolveBusinessSettings,
  type BusinessSettings,
} from '@/lib/businessSettings';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { HELP } from '@/lib/helpTexts';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader, SectionPanel, InsightBanner, StatusPill } from '@/components/design';
import {
  SettingsTopTabs,
  SettingsSectionHeading,
  SettingsBlock,
  ModuleFeatureCard,
  PermissionChip,
  MemberCard,
  DangerZonePanel,
  CategoryTag,
} from '@/components/modules/settings/settings-ui';

type TabId = 'profile' | 'household' | 'categories';

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const { categories, addCategory, deleteCategory } = useBudgetStore();
  const {
    user,
    updateUser,
    updateMember,
    patchMemberLocally,
    removeMember,
    addMember,
    updateHouseholdSettings,
    deleteHousehold,
  } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [localProfile, setLocalProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [householdName, setHouseholdName] = useState(user?.household?.name || '');
  const [businessEnabled, setBusinessEnabled] = useState(user?.household?.businessEnabled ?? user?.household?.business_enabled ?? true);
  const [businessName, setBusinessName] = useState(user?.household?.businessName ?? user?.household?.business_name ?? 'Little Loom');
  const [shopifyShopUrl, setShopifyShopUrl] = useState(user?.household?.shopifyShopUrl ?? user?.household?.shopify_shop_url ?? '');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  const hasShopifyToken = user?.household?.hasShopifyToken ?? user?.household?.has_shopify_token ?? false;
  const [utilitySplitEnabled, setUtilitySplitEnabled] = useState(user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true);
  const [utilitySplitPartnerId, setUtilitySplitPartnerId] = useState<number | null>(
    user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id ?? null,
  );
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() =>
    resolveBusinessSettings(user?.household),
  );
  const [utilityTemplates, setUtilityTemplates] = useState<UtilityTemplate[]>(() =>
    resolveUtilityTemplates(user?.household),
  );
  const [isHouseholdSaving, setIsHouseholdSaving] = useState(false);

  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor' | 'reader',
    permissions: ['budget', 'utilities'],
  });

  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [isDeletingHousehold, setIsDeletingHousehold] = useState(false);

  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const MODULES = [
    { id: 'budget', label: 'Költségvetés', icon: Wallet, description: '/budget — bevételek, kiadások' },
    { id: 'savings', label: 'Megtakarítások', icon: Shield, description: '/savings — Széf, állampapírok' },
    { id: 'debts', label: 'Tartozások', icon: TrendingDown, description: '/debts — hitelek, kölcsönök' },
    { id: 'utilities', label: 'Rezsi', icon: Droplets, description: '/utilities — közüzemi számlák' },
    { id: 'meters', label: 'Mérőórák', icon: Gauge, description: '/meters — fogyasztás' },
    { id: 'business', label: businessEnabled ? businessName : 'Vállalkozás', icon: ShoppingBag, description: '/business — webshop' },
  ];

  useEffect(() => {
    setLocalProfile({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' });
    if (user?.household) {
      setHouseholdName(user.household.name || '');
      setBusinessEnabled(user.household.businessEnabled ?? user.household.business_enabled ?? true);
      setBusinessName(user.household.businessName ?? user.household.business_name ?? 'Little Loom');
      setShopifyShopUrl(user.household.shopifyShopUrl ?? user.household.shopify_shop_url ?? '');
      setShopifyAccessToken('');
      setUtilitySplitEnabled(user.household.utilitySplitEnabled ?? user.household.utility_split_enabled ?? true);
      setUtilitySplitPartnerId(user.household.utilitySplitPartnerId ?? user.household.utility_split_partner_id ?? null);
      setBusinessSettings(resolveBusinessSettings(user.household));
      setUtilityTemplates(resolveUtilityTemplates(user.household));
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const householdDisplayName = user?.household?.name || '';
  const deleteNameMatches = deleteConfirmName.trim() === householdDisplayName.trim();
  const canConfirmDelete = deleteNameMatches && deleteAcknowledged && !isDeletingHousehold;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(localProfile);
      addNotification('Profil sikeresen mentve!', 'success');
    } catch {
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
      await updateUser({ password: newPassword, password_confirmation: confirmPassword } as unknown as Parameters<typeof updateUser>[0]);
      setNewPassword('');
      setConfirmPassword('');
      addNotification('Jelszó sikeresen megváltoztatva!', 'success');
    } catch {
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
      if (!shopifyShopUrl.trim()) {
        addNotification('A Shopify bolt URL-jét kötelező megadni!', 'error');
        setIsHouseholdSaving(false);
        return;
      }
      if (!hasShopifyToken && !shopifyAccessToken.trim()) {
        addNotification('Az Admin API tokent kötelező megadni az első mentésnél!', 'error');
        setIsHouseholdSaving(false);
        return;
      }
      if (shopifyAccessToken.trim() && !/^shpat_|^shpua_/i.test(shopifyAccessToken.trim())) {
        addNotification('A Shopify token shpat_ vagy shpua_ előtaggal kell kezdődjön.', 'error');
        setIsHouseholdSaving(false);
        return;
      }
    }
    if (utilitySplitEnabled && utilityPartners.length > 0 && !utilitySplitPartnerId) {
      addNotification('Válassz elszámolási partnert a rezsi megosztáshoz!', 'error');
      setIsHouseholdSaving(false);
      return;
    }
    try {
      const payload: Parameters<typeof updateHouseholdSettings>[0] = {
        name: householdName,
        business_enabled: businessEnabled,
        business_name: businessName,
        shopify_shop_url: businessEnabled ? shopifyShopUrl : '',
        utility_split_enabled: utilitySplitEnabled,
        utility_split_partner_id: utilitySplitEnabled ? utilitySplitPartnerId : null,
        business_settings: businessSettings,
        utility_templates: utilityTemplates.filter((t) => t.type.trim()),
      };
      if (shopifyAccessToken.trim()) {
        payload.shopify_access_token = shopifyAccessToken.trim();
      }
      await updateHouseholdSettings(payload);
      setUtilityTemplates(resolveUtilityTemplates(useAuthStore.getState().user?.household));
      setShopifyAccessToken('');
      addNotification('Háztartás beállítások mentve!', 'success');
    } catch {
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
      permissions: newMemberData.permissions,
    });
    setNewMemberData({ firstName: '', lastName: '', email: '', password: '', role: 'editor', permissions: ['budget', 'utilities'] });
    addNotification('Új tag létrehozva!', 'success');
  };

  const handleDeleteHousehold = async () => {
    if (!canConfirmDelete) return;
    setIsDeletingHousehold(true);
    try {
      await deleteHousehold(deleteConfirmName.trim());
    } catch {
      addNotification('A törlés nem sikerült. Ellenőrizd a háztartás nevét.', 'error');
      setIsDeletingHousehold(false);
    }
  };

  const toggleMemberPermission = (memberId: number, moduleId: string) => {
    const member = user?.household?.users?.find((u) => u.id === memberId);
    if (!member) return;
    const currentPermissions = member.permissions || [];
    const newPermissions = currentPermissions.includes(moduleId)
      ? currentPermissions.filter((p) => p !== moduleId)
      : [...currentPermissions, moduleId];
    patchMemberLocally(memberId, { permissions: newPermissions });
    void updateMember(memberId, { permissions: newPermissions }, { silent: true });
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profilom', icon: User, hint: 'Személyes adatok, jelszó, fiók törlése' },
    { id: 'household', label: 'Háztartás', icon: Home, hint: 'Családtagok, modulok, integrációk' },
    { id: 'categories', label: 'Kategóriák', icon: FolderTree, hint: 'Költségvetés címkéi' },
  ];

  const utilityPartners = user?.household?.users?.filter((u) => u.id !== user.id) || [];

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Rendszer' }, { label: 'Beállítások' }]}
        title="Beállítások"
        description="Profil, háztartás és kategóriák — minden egy helyen."
      />

      <SettingsTopTabs tabs={settingsTabs} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-8 w-full"
        >
          {activeTab === 'profile' && (
            <>
              <SettingsSectionHeading
                title="Profilom"
                description="Személyes adataid és biztonsági beállítások. A háztartás törlése csak adminnak érhető el lent."
              />

              <SettingsBlock
                title="Személyes adatok"
                description="A neved és e-mail címed megjelenik a többi családtag felé."
                icon={User}
                toneClassName="bg-primary/10 text-primary"
                footer={
                  <Button type="submit" form="profile-form" disabled={isSaving}>
                    <Save size={13} />
                    {isSaving ? 'Feldolgozás…' : 'Mentés'}
                  </Button>
                }
              >
                <form id="profile-form" onSubmit={handleProfileSave} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Keresztnév" info={HELP.settings.firstName}>
                      <Input
                        value={localProfile.firstName}
                        onChange={(e) => setLocalProfile({ ...localProfile, firstName: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Vezetéknév" info={HELP.settings.lastName}>
                      <Input
                        value={localProfile.lastName}
                        onChange={(e) => setLocalProfile({ ...localProfile, lastName: e.target.value })}
                      />
                    </FormField>
                  </div>
                  <FormField label="E-mail cím" info={HELP.settings.email}>
                    <Input
                      type="email"
                      value={localProfile.email}
                      onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                    />
                  </FormField>
                </form>
              </SettingsBlock>

              <SettingsBlock
                title="Biztonság"
                description="Frissítsd a jelszavadat. Minimum 8 karakter."
                icon={Key}
                toneClassName="bg-amber-500/10 text-amber-600"
                footer={
                  <Button type="submit" form="password-form" disabled={isPasswordSaving}>
                    <Key size={13} />
                    {isPasswordSaving ? 'Feldolgozás…' : 'Jelszó frissítése'}
                  </Button>
                }
              >
                <form id="password-form" onSubmit={handlePasswordSave} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Új jelszó" info={HELP.settings.password}>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField label="Új jelszó megerősítése" info={HELP.settings.passwordConfirm}>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                </form>
              </SettingsBlock>

              {isAdmin && (
                <DangerZonePanel
                  title="Háztartás és fiókok törlése"
                  description="Véglegesen törli a teljes háztartást, az összes pénzügyi adatot és minden családtag fiókját. A művelet nem vonható vissza."
                >
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 list-disc pl-4">
                    <li>Minden költségvetés, rezsi, tartozás, megtakarítás törlődik</li>
                    <li>Minden családtag fiókja törlődik az adatbázisból</li>
                    <li>Azonnal kijelentkeztet és a bejelentkezés oldalra irányít</li>
                  </ul>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteConfirmName('');
                      setDeleteAcknowledged(false);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 size={13} /> Háztartás végleges törlése…
                  </Button>
                </DangerZonePanel>
              )}
            </>
          )}

          {activeTab === 'household' && (
            <>
              <SettingsSectionHeading
                title="Háztartás"
                description="Családtagok, jogosultságok és opcionális bővítések a PenzPilot-hoz."
                badge={
                  <StatusPill status="neutral" size="xs">
                    {user?.household?.users?.length || 0} tag
                  </StatusPill>
                }
              />

              {!isAdmin && (
                <InsightBanner tone="info" icon={ShieldAlert} title="Csak megtekintés">
                  A háztartás beállításait csak az adminisztrátor módosíthatja. A tagok listáját lent láthatod.
                </InsightBanner>
              )}

              {isAdmin && (
                <form onSubmit={handleHouseholdSave} className="flex flex-col gap-6">
                  <SettingsBlock
                    title="Háztartás"
                    description="A háztartás megjelenő neve az egész család számára."
                    icon={Home}
                    toneClassName="bg-primary/10 text-primary"
                  >
                    <FormField label="Háztartás neve" info={HELP.settings.householdName}>
                      <Input
                        value={householdName}
                        onChange={(e) => setHouseholdName(e.target.value)}
                        required
                        placeholder="Pl. Kovács Család"
                      />
                    </FormField>
                  </SettingsBlock>

                  <SettingsBlock
                    title="Modulok és integrációk"
                    description="Kapcsold be a szükséges funkciókat és állítsd be az integrációkat."
                    icon={ShoppingBag}
                    toneClassName="bg-violet-500/10 text-violet-600"
                    footer={
                      <Button type="submit" disabled={isHouseholdSaving}>
                        <Save size={13} />
                        {isHouseholdSaving ? 'Mentés…' : 'Mentés'}
                      </Button>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                    <ModuleFeatureCard
                      title="Vállalkozás"
                      description="Shopify rendelések importja, webshop követés a Vállalkozás oldalon."
                      enabled={businessEnabled}
                      onToggle={() => setBusinessEnabled((v) => !v)}
                      icon={<SiShopify size={22} className="text-[#95BF47]" aria-hidden />}
                      iconClassName="bg-[#95BF47]/15 border border-[#95BF47]/25"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        <FormField label="Megjelenő név" info={HELP.settings.businessName}>
                          <Input
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Pl. Little Loom"
                          />
                        </FormField>
                        <FormField label="Shopify bolt URL" info={HELP.settings.shopifyUrl}>
                          <Input
                            value={shopifyShopUrl}
                            onChange={(e) => setShopifyShopUrl(e.target.value)}
                            placeholder="bolt-neve.myshopify.com"
                          />
                        </FormField>
                        <FormField
                          label="Admin API token"
                          info={HELP.settings.shopifyToken}
                          hint={
                            hasShopifyToken
                              ? 'Mentett token van — hagyd üresen, ha nem cseréled. Új token: shpat_ előtaggal.'
                              : 'Kötelező az első mentésnél. A token shpat_ karakterekkel kezdődik.'
                          }
                        >
                          <div className="relative">
                            <Lock
                              size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            />
                            <Input
                              type="password"
                              className="pl-8 font-mono text-sm"
                              value={shopifyAccessToken}
                              onChange={(e) => setShopifyAccessToken(e.target.value)}
                              placeholder={
                                hasShopifyToken
                                  ? 'Üresen hagyva: megtartjuk a mentett tokent'
                                  : 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                              }
                              autoComplete="new-password"
                              spellCheck={false}
                            />
                          </div>
                        </FormField>
                      </div>
                    </ModuleFeatureCard>

                    <ModuleFeatureCard
                      title="Rezsi megosztás"
                      description="Közös számlák elszámolása: ki fizette, mennyi a partner tartozása."
                      enabled={utilitySplitEnabled}
                      onToggle={() => setUtilitySplitEnabled((v) => !v)}
                      icon={<Handshake size={22} strokeWidth={2} />}
                      iconClassName="bg-sky-500/12 text-sky-600 border border-sky-500/20"
                    >
                      <FormField label="Elszámolási partner" info={HELP.settings.splitPartner}>
                        {utilityPartners.length === 0 ? (
                          <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
                            Nincs más tag. Először hozz létre egy családtagot lent.
                          </p>
                        ) : (
                          <select
                            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                            value={utilitySplitPartnerId || ''}
                            onChange={(e) => setUtilitySplitPartnerId(e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">Válassz partnert…</option>
                            {utilityPartners.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.firstName} {p.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </FormField>
                    </ModuleFeatureCard>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Rezsi sablon tételek</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Új hónap indításához — minden háztartás saját listát állíthat be. Üres lista esetén a Rezsi oldalon a
                          múlt havi másolás vagy kézi rögzítés használható.
                        </p>
                      </div>
                      <UtilityTemplatesEditor
                        value={utilityTemplates}
                        onChange={setUtilityTemplates}
                        isAdmin={isAdmin}
                      />
                    </div>

                    {businessEnabled && (
                      <div className="mt-6 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">Vállalkozás mezői</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ezek a listák jelennek meg a rendelés rögzítésénél — minden háztartás sajátot állíthat be.
                          </p>
                        </div>
                        <BusinessOptionsEditor value={businessSettings} onChange={setBusinessSettings} />
                      </div>
                    )}
                  </SettingsBlock>
                </form>
              )}

              <div className="flex flex-col gap-4">
                <SettingsSectionHeading
                  title="Családtagok"
                  description={
                    isAdmin
                      ? 'Szerepkör és modul hozzáférés — kattints a modulokra a jogosultság váltásához.'
                      : 'A háztartásban regisztrált felhasználók.'
                  }
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {user?.household?.users?.map((member) => {
                    const memberPermissions = member.permissions || [];
                    const isMemberAdmin = member.role === 'admin';
                    const initials = `${(member.firstName || '?')[0]}${(member.lastName || '?')[0]}`.toUpperCase();
                    return (
                      <MemberCard
                        key={member.id}
                        initials={initials}
                        name={`${member.firstName} ${member.lastName}`}
                        email={member.email}
                        badges={
                          <>
                            {isMemberAdmin && (
                              <StatusPill status="primary" size="xs">
                                <ShieldAlert size={10} /> admin
                              </StatusPill>
                            )}
                            {member.id === user?.id && <StatusPill status="neutral" size="xs">Én</StatusPill>}
                          </>
                        }
                        actions={
                          isAdmin && member.id !== user?.id ? (
                            <>
                              <select
                                value={member.role || 'editor'}
                                onChange={(e) => {
                                  const role = e.target.value as 'admin' | 'editor' | 'reader';
                                  patchMemberLocally(member.id, { role });
                                  void updateMember(member.id, { role }, { silent: true });
                                }}
                                className="h-8 rounded-lg border border-border bg-input px-2.5 text-xs font-medium appearance-none focus:border-ring outline-none"
                              >
                                <option value="admin">Admin</option>
                                <option value="editor">Szerkesztő</option>
                                <option value="reader">Olvasó</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  requestDelete({
                                    title: 'Tag eltávolítása',
                                    message: `Biztosan eltávolítod ${member.firstName} ${member.lastName} fiókját a háztartásból?`,
                                    confirmText: 'Eltávolítás',
                                    onConfirm: () => removeMember(member.id),
                                  })
                                }
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          ) : undefined
                        }
                        permissions={MODULES.map((mod) => {
                          const hasAccess = isMemberAdmin || memberPermissions.includes(mod.id);
                          const Icon = mod.icon;
                          const disabled = !isAdmin || member.id === user?.id || isMemberAdmin;
                          return (
                            <PermissionChip
                              key={mod.id}
                              label={mod.label}
                              icon={Icon}
                              active={hasAccess}
                              disabled={disabled}
                              onClick={disabled ? undefined : () => toggleMemberPermission(member.id, mod.id)}
                              title={mod.description}
                            />
                          );
                        })}
                      />
                    );
                  })}
                </div>
              </div>

              {isAdmin && (
                <SettingsBlock
                  title="Új családtag"
                  description="Hozz létre egy fiókot — e-maillel és ideiglenes jelszóval tud majd belépni."
                  icon={UserPlus}
                  toneClassName="bg-emerald-500/10 text-emerald-600"
                  footer={
                    <Button type="submit" form="new-member-form">
                      <UserPlus size={13} /> Fiók létrehozása
                    </Button>
                  }
                >
                  <form id="new-member-form" onSubmit={handleAddMember} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Keresztnév" info={HELP.settings.firstName}>
                        <Input
                          placeholder="Ildi"
                          value={newMemberData.firstName}
                          onChange={(e) => setNewMemberData({ ...newMemberData, firstName: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Vezetéknév" info={HELP.settings.lastName}>
                        <Input
                          placeholder="Kovács"
                          value={newMemberData.lastName}
                          onChange={(e) => setNewMemberData({ ...newMemberData, lastName: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="E-mail" info={HELP.settings.inviteEmail}>
                        <Input
                          type="email"
                          placeholder="ildi@example.com"
                          value={newMemberData.email}
                          onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                          required
                        />
                      </FormField>
                      <FormField label="Ideiglenes jelszó" info={HELP.settings.invitePassword}>
                        <div className="relative">
                          <Lock
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                          />
                          <Input
                            type="password"
                            className="pl-8"
                            placeholder="••••••••"
                            value={newMemberData.password}
                            onChange={(e) => setNewMemberData({ ...newMemberData, password: e.target.value })}
                            required
                          />
                        </div>
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField label="Szerepkör" info={HELP.settings.inviteRole}>
                          <select
                            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                            value={newMemberData.role}
                            onChange={(e) =>
                              setNewMemberData({ ...newMemberData, role: e.target.value as 'admin' | 'editor' | 'reader' })
                            }
                          >
                            <option value="editor">Szerkesztő (szerkeszthet, hozzáadhat)</option>
                            <option value="reader">Olvasó (csak megtekint)</option>
                            <option value="admin">Adminisztrátor (teljes hozzáférés)</option>
                          </select>
                        </FormField>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border">
                      <FieldLabel info={HELP.settings.invitePermissions}>Alapértelmezett modul jogosultságok</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {MODULES.map((mod) => {
                          const Icon = mod.icon;
                          const active = newMemberData.permissions.includes(mod.id);
                          return (
                            <PermissionChip
                              key={mod.id}
                              label={mod.label}
                              icon={Icon}
                              active={active}
                              onClick={() => {
                                const current = newMemberData.permissions;
                                const updated = current.includes(mod.id)
                                  ? current.filter((p) => p !== mod.id)
                                  : [...current, mod.id];
                                setNewMemberData({ ...newMemberData, permissions: updated });
                              }}
                              title={mod.description}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </SettingsBlock>
              )}
            </>
          )}

          {activeTab === 'categories' && (
            <>
              <SettingsSectionHeading
                title="Kategóriák"
                description="A költségvetésben használt címkék — strukturálják a kiadásokat és bevételeket."
                badge={
                  <StatusPill status="neutral" size="xs">
                    {categories.length} db
                  </StatusPill>
                }
              />
              <SectionPanel title="Kategória lista" icon={FolderTree} tone="primary">
                <div className="flex flex-col gap-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCat.trim()) {
                        addCategory(newCat.trim());
                        setNewCat('');
                      }
                    }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-end rounded-xl border border-dashed border-border bg-muted/20 p-4"
                  >
                    <div className="flex-1">
                      <FormField label="Új kategória" info={HELP.settings.categoryName}>
                        <Input
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value)}
                          placeholder="pl. Élelmiszer, Rezsi, Autó…"
                          className="w-full bg-card"
                        />
                      </FormField>
                    </div>
                    <Button type="submit" className="shrink-0 sm:mb-0.5" disabled={!newCat.trim()}>
                      <Plus size={13} /> Hozzáadás
                    </Button>
                  </form>

                  {categories.length === 0 ? (
                    <InsightBanner tone="info" icon={FolderTree} title="Még nincs kategória">
                      Adj hozzá kategóriákat a költségvetésed strukturálásához — pl. Élelmiszer, Rezsi, Szórakozás.
                    </InsightBanner>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <CategoryTag
                          key={cat}
                          name={cat}
                          onDelete={() =>
                            requestDelete({
                              title: 'Kategória törlése',
                              message: `Biztosan törlöd a „${cat}" kategóriát? A meglévő tételek nem törlődnek.`,
                              onConfirm: () => deleteCategory(cat),
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </SectionPanel>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeletingHousehold && setIsDeleteModalOpen(false)}
        title="Háztartás végleges törlése"
        description="Ez a művelet nem vonható vissza. Minden adat és fiók törlődik."
        size="md"
        contentKey={deleteAcknowledged ? 'ack' : 'open'}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              A <strong className="font-semibold">{householdDisplayName}</strong> háztartás és{' '}
              <strong className="font-semibold">{user?.household?.users?.length || 0} felhasználó</strong> összes adata
              véglegesen törlődik.
            </p>
          </div>

          <FormField
            label={
              <>
                Írd be a háztartás nevét: <span className="font-semibold text-foreground">{householdDisplayName}</span>
              </>
            }
            info={HELP.settings.deleteHousehold}
          >
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={householdDisplayName}
              autoComplete="off"
            />
          </FormField>

          <label className="flex items-start gap-2.5 cursor-pointer text-sm text-foreground">
            <input
              type="checkbox"
              checked={deleteAcknowledged}
              onChange={(e) => setDeleteAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>Megértem, hogy a törlés végleges és minden családtag fiókja eltűnik.</span>
          </label>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingHousehold}>
              Mégse
            </Button>
            <Button variant="destructive" disabled={!canConfirmDelete} onClick={handleDeleteHousehold}>
              {isDeletingHousehold ? 'Törlés…' : 'Végleges törlés'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
