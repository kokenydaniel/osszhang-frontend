'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ProductUpdatePreview } from '@/components/product-updates/ProductUpdatePreview';
import { useAuthStore } from '@/stores/useAuthStore';
import { authClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { isImpersonating } from '@/helpers/impersonation-session';
import { needsHouseholdOnboarding } from '@/helpers/household-onboarding';
import { resolveProductUpdateCta } from '@/helpers/product-update-helpers';
import { openUpgradeModal } from '@/stores/useUpgradeModalStore';
import config from '@/config/config';

export function ProductUpdateModal() {
  const user = useAuthStore((state) => state.user);
  const refreshSessionQuiet = useAuthStore((state) => state.refreshSessionQuiet);
  const update = user?.pending_product_update ?? null;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const blocked = !user || isImpersonating() || needsHouseholdOnboarding(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (blocked || !update) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [blocked, update?.id]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const cta = useMemo(
    () => (update && user ? resolveProductUpdateCta(user, update) : null),
    [update, user],
  );

  const moduleLabel =
    update?.module_id && config.modules.labels[update.module_id as keyof typeof config.modules.labels]
      ? config.modules.labels[update.module_id as keyof typeof config.modules.labels]
      : null;

  const handleDismiss = useCallback(async () => {
    if (!update) return;
    setDismissing(true);
    try {
      const res = await authClient.dismissProductUpdate(update.id);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setOpen(false);
      useAuthStore.setState((state) => ({
        user: state.user
          ? { ...state.user, pending_product_update: null, pendingProductUpdate: null }
          : null,
      }));
      await refreshSessionQuiet();
    } catch (error) {
      console.error('[ProductUpdateModal] dismiss failed', error);
    } finally {
      setDismissing(false);
    }
  }, [refreshSessionQuiet, update]);

  const handleCta = useCallback(() => {
    if (!cta) return;
    if (cta.type === 'upgrade') {
      openUpgradeModal({
        requiredTier: cta.requiredTier,
        moduleId: cta.moduleId,
        featureLabel: moduleLabel ?? update?.title,
      });
      return;
    }
    void handleDismiss();
  }, [cta, handleDismiss, moduleLabel, update?.title]);

  if (!mounted || !update || blocked) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key={update.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[460] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'oklch(0.18 0.02 260 / 55%)' }}
          role="presentation"
          onClick={() => void handleDismiss()}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl max-h-[min(94dvh,920px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-update-title"
          >
            <div className="relative flex flex-col min-h-0 max-h-full overflow-hidden rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl ring-1 ring-white/10">
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 z-10 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-foreground"
                onClick={() => void handleDismiss()}
                aria-label="Bezárás"
              >
                <X size={18} />
              </Button>

              <div className="overflow-y-auto overscroll-contain min-h-0 flex-1">
                <ProductUpdatePreview update={update} embedded />
              </div>

              <div className="shrink-0 border-t border-border/80 bg-muted/20 px-5 py-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button variant="ghost" onClick={() => void handleDismiss()} loading={dismissing}>
                  Később emlékeztess
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  {cta?.type === 'link' ? (
                    <Button size="lg" className="shadow-md" asChild onClick={() => void handleDismiss()}>
                      <Link href={cta.href}>
                        {cta.label}
                        <ArrowRight size={16} />
                      </Link>
                    </Button>
                  ) : cta?.type === 'upgrade' ? (
                    <Button size="lg" className="shadow-md" onClick={handleCta}>
                      <Star size={16} className="fill-current" />
                      {cta.label}
                    </Button>
                  ) : (
                    <Button size="lg" className="shadow-md" onClick={() => void handleDismiss()}>
                      Rendben, értem
                      <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
