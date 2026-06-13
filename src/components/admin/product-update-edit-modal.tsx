'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design/ModalFormFooter';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Button } from '@/components/ui/button';
import { ProductUpdatePreview } from '@/components/product-updates/ProductUpdatePreview';
import {
  getProductUpdateTemplate,
  mergeProductUpdatePayload,
  PRODUCT_UPDATE_TEMPLATES,
} from '@/config/product-update-templates';
import type {
  ProductUpdate,
  ProductUpdateAudienceRole,
  ProductUpdateKind,
  ProductUpdatePayload,
  ProductUpdateRequiredTier,
} from '@/types/admin';

type ProductUpdateEditModalProps = {
  update: ProductUpdate | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (id: number, payload: ProductUpdatePayload) => void | Promise<void>;
};

const TIER_OPTIONS: { value: ProductUpdateRequiredTier; label: string }[] = [
  { value: 'all', label: 'Minden csomag' },
  { value: 'free', label: 'Ingyenes+' },
  { value: 'pro', label: 'Pro+' },
  { value: 'premium', label: 'Premium' },
];

const ROLE_OPTIONS: { value: ProductUpdateAudienceRole; label: string }[] = [
  { value: 'all', label: 'Mindenki' },
  { value: 'admin', label: 'Csak háztartás admin' },
  { value: 'editor', label: 'Csak szerkesztő' },
  { value: 'reader', label: 'Csak olvasó' },
];

function emptyBullets(values: string[]) {
  return values.length > 0 ? values : [''];
}

export function ProductUpdateEditModal({ update, saving = false, onClose, onSave }: ProductUpdateEditModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [bullets, setBullets] = useState<string[]>(['']);
  const [locationHint, setLocationHint] = useState('');
  const [kind, setKind] = useState<ProductUpdateKind>('new');
  const [moduleId, setModuleId] = useState('');
  const [requiredTier, setRequiredTier] = useState<ProductUpdateRequiredTier>('all');
  const [audienceRole, setAudienceRole] = useState<ProductUpdateAudienceRole>('all');
  const [heroIcon, setHeroIcon] = useState('');
  const [priority, setPriority] = useState('0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!update) return;
    setTitle(update.title);
    setSubtitle(update.subtitle ?? '');
    setBody(update.body);
    setBullets(emptyBullets(update.bullets ?? []));
    setLocationHint(update.location_hint ?? '');
    setKind(update.kind);
    setModuleId(update.module_id ?? '');
    setRequiredTier(update.required_tier ?? 'all');
    setAudienceRole(update.audience_role ?? 'all');
    setHeroIcon(update.hero_icon ?? '');
    setPriority(String(update.priority ?? 0));
  }, [update]);

  const preview = useMemo(
    () => ({
      title,
      subtitle: subtitle || null,
      body,
      bullets: bullets.map((b) => b.trim()).filter(Boolean),
      location_hint: locationHint || null,
      kind,
      module_id: moduleId || null,
      hero_icon: heroIcon || null,
    }),
    [audienceRole, body, bullets, heroIcon, kind, locationHint, moduleId, subtitle, title],
  );

  if (!update) return null;

  const applyTemplate = (templateId: string) => {
    const template = getProductUpdateTemplate(templateId);
    if (!template) return;
    const payload = mergeProductUpdatePayload(template);
    setTitle(payload.title);
    setSubtitle(payload.subtitle ?? '');
    setBody(payload.body);
    setBullets(emptyBullets(payload.bullets ?? []));
    setLocationHint(payload.location_hint ?? '');
    setKind(payload.kind ?? 'new');
    setModuleId(payload.module_id ?? '');
    setRequiredTier(payload.required_tier ?? 'all');
    setAudienceRole(payload.audience_role ?? 'all');
    setHeroIcon(payload.hero_icon ?? template.heroIcon);
    setPriority(String(payload.priority ?? 0));
  };

  const handleSubmit = () => {
    const payload: ProductUpdatePayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      body: body.trim(),
      bullets: bullets.map((item) => item.trim()).filter(Boolean),
      location_hint: locationHint.trim() || null,
      kind,
      module_id: moduleId || null,
      required_tier: requiredTier,
      audience_role: audienceRole,
      hero_icon: heroIcon.trim() || null,
      priority: Number.parseInt(priority, 10) || 0,
    };
    void onSave(update.id, payload);
  };

  return (
    <Modal isOpen onClose={onClose} title="Újdonság szerkesztése" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="pu-template">Sablon újraalkalmazása</FieldLabel>
            <select
              id="pu-template"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">— Válassz sablont a szöveghez —</option>
              {PRODUCT_UPDATE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <ProductUpdatePreview update={preview} compact />

          <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? 'Haladó mezők elrejtése' : 'Haladó mezők szerkesztése'}
          </Button>

          {showAdvanced ? (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 bg-muted/10">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cím" />
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Alcím" />
              <textarea
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <Input value={locationHint} onChange={(e) => setLocationHint(e.target.value)} placeholder="Hol találod" />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                  value={requiredTier}
                  onChange={(e) => setRequiredTier(e.target.value as ProductUpdateRequiredTier)}
                >
                  {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                  value={audienceRole}
                  onChange={(e) => setAudienceRole(e.target.value as ProductUpdateAudienceRole)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="Prioritás"
              />
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Nagy képernyőn
          </p>
          <ProductUpdatePreview update={preview} />
        </div>
      </div>

      <ModalFormFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Mentés"
        submitType="button"
        loading={saving}
      />
    </Modal>
  );
}
