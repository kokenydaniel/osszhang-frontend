'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient, getApiErrorMessage } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { isAbortError } from '@/lib/api-client/abortError';
import { getAuthToken } from '@/helpers/auth-token';
import { startImpersonationSession } from '@/helpers/impersonation-session';
import { resetSessionData } from '@/helpers/reset-session-data';
import { formatDisplayName } from '@/utils/person-name';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { AdminHousehold, AdminHouseholdMember, AdminHouseholdAiSettingsPayload, AdminTierGrantPayload } from '@/types/admin';

export function useAdminHouseholdDetailPageData(householdId: number) {
  const [household, setHousehold] = useState<AdminHousehold | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { patchHousehold } = useAdminStore();
  const { user, fetchMe, setAuthToken } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();

  const { pending: activating, run: runActivate } = useAsyncAction();
  const { pending: deactivating, run: runDeactivate } = useAsyncAction();
  const { pending: impersonating, run: runImpersonate } = useAsyncAction();
  const { pending: savingTierGrant, run: runTierGrant } = useAsyncAction();
  const { pending: savingAiSettings, run: runAiSettings } = useAsyncAction();
  const { pending: deletingHousehold, run: runDeleteHousehold } = useAsyncAction();
  const { pending: resettingPassword, run: runResetPassword } = useAsyncAction();

  const refreshHousehold = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await adminClient.showHousehold(householdId);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setHousehold(res[1].data);
      patchHousehold(res[1].data);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminHouseholdDetailPageData] fetch failed', error);
        setLoadError(true);
        addNotification('A háztartás betöltése nem sikerült.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, householdId, patchHousehold]);

  useEffect(() => {
    void refreshHousehold();
  }, [refreshHousehold]);

  const activateMember = useCallback(
    async (member: AdminHouseholdMember) => {
      const result = await runActivate(async () => {
        try {
          const res = await adminClient.activateUser(member.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          addNotification('Felhasználó aktiválva.', 'success');
          await refreshHousehold();
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az aktiválás nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, refreshHousehold, runActivate],
  );

  const deactivateMember = useCallback(
    async (member: AdminHouseholdMember) => {
      const result = await runDeactivate(async () => {
        try {
          const res = await adminClient.deactivateUser(member.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          addNotification('Felhasználó inaktiválva.', 'success');
          await refreshHousehold();
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az inaktiválás nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, refreshHousehold, runDeactivate],
  );

  const impersonateMember = useCallback(
    async (member: AdminHouseholdMember) => {
      const result = await runImpersonate(async () => {
        try {
          const originToken = getAuthToken();
          if (!originToken) {
            addNotification('Nincs érvényes munkamenet.', 'error');
            return false;
          }

          const res = await adminClient.impersonateUser(member.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          const payload = res[1];
          const label = formatDisplayName(member.first_name, member.last_name) || member.username;

          startImpersonationSession(originToken, label);
          setAuthToken(payload.access_token);
          resetSessionData();
          useAdminStore.getState().reset();
          await fetchMe();
          addNotification(`Megszemélyesítés: ${label}`, 'info');
          router.push('/');
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A megszemélyesítés nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, fetchMe, router, runImpersonate, setAuthToken],
  );

  const updateTierGrant = useCallback(
    async (payload: AdminTierGrantPayload) => {
      const result = await runTierGrant(async () => {
        try {
          const res = await adminClient.updateHouseholdTierGrant(householdId, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          setHousehold(res[1].data);
          patchHousehold(res[1].data);
          addNotification('Hozzáférési grant mentve.', 'success');
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A grant mentése nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, householdId, patchHousehold, runTierGrant],
  );

  const updateAiSettings = useCallback(
    async (payload: AdminHouseholdAiSettingsPayload) => {
      const result = await runAiSettings(async () => {
        try {
          const res = await adminClient.updateHouseholdAiSettings(householdId, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          setHousehold(res[1].data);
          patchHousehold(res[1].data);
          addNotification('AI korlátozás mentve.', 'success');
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az AI korlátozás mentése nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, householdId, patchHousehold, runAiSettings],
  );

  const deleteHousehold = useCallback(
    async (confirmName: string) => {
      const result = await runDeleteHousehold(async () => {
        try {
          const res = await adminClient.deleteHousehold(householdId, confirmName);
          if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
            throw new Error('API Error');
          }
          addNotification('A háztartás törölve.', 'success');
          router.push('/admin/households');
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A háztartás törlése nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, householdId, router, runDeleteHousehold],
  );

  const resetMemberPassword = useCallback(
    async (member: AdminHouseholdMember, password: string, passwordConfirmation: string) => {
      const result = await runResetPassword(async () => {
        try {
          const res = await adminClient.resetUserPassword(member.id, password, passwordConfirmation);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          addNotification(
            res[1].message ?? 'Ideiglenes jelszó beállítva — első belépéskor meg kell változtatnia.',
            'success',
          );
          await refreshHousehold();
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A jelszó beállítása nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, refreshHousehold, runResetPassword],
  );

  const canManageMember = useCallback(
    (member: AdminHouseholdMember) => {
      if (!user) return false;
      if (member.id === user.id) return false;
      if (member.lifetime_admin) return false;
      return true;
    },
    [user],
  );

  return {
    household,
    isLoading,
    loadError,
    activating,
    deactivating,
    impersonating,
    savingTierGrant,
    savingAiSettings,
    deletingHousehold,
    resettingPassword,
    refreshHousehold,
    activateMember,
    deactivateMember,
    impersonateMember,
    updateTierGrant,
    updateAiSettings,
    deleteHousehold,
    resetMemberPassword,
    canManageMember,
  };
}
