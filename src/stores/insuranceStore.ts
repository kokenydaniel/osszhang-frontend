'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { insuranceClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { InsurancePolicy, InsuranceUpcomingReminder } from '@/types/insurance';

interface InsuranceState {
  status: LoadableStatus;
  policies: InsurancePolicy[];
  budgetPolicies: InsurancePolicy[];
  upcoming: InsuranceUpcomingReminder[];

  fetch: (force?: boolean) => Promise<void>;
  setData: (policies: InsurancePolicy[], upcoming: InsuranceUpcomingReminder[], budgetPolicies?: InsurancePolicy[]) => void;
  upsertPolicy: (policy: InsurancePolicy) => void;
  removePolicy: (id: number) => void;
  markPolicyDeleted: (policy: InsurancePolicy) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  policies: [] as InsurancePolicy[],
  budgetPolicies: [] as InsurancePolicy[],
  upcoming: [] as InsuranceUpcomingReminder[],
};

function syncBudgetPolicies(budgetPolicies: InsurancePolicy[], policy: InsurancePolicy): InsurancePolicy[] {
  const idx = budgetPolicies.findIndex((p) => p.id === policy.id);
  if (idx >= 0) {
    return budgetPolicies.map((p) => (p.id === policy.id ? policy : p));
  }
  return [...budgetPolicies, policy].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
}

export const insuranceStore = create<InsuranceState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (force = false) => {
        if (!force && get().status === LoadableStatus.Loaded) return;

        const isRefresh = get().status === LoadableStatus.Loaded;
        if (!isRefresh) {
          set({ status: LoadableStatus.Loading });
        }

        try {
          const res = await insuranceClient.getIndex({ silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          const data = res[1];
          const policies = data?.policies ?? [];
          const budgetPolicies = data?.budgetPolicies ?? policies;
          set({
            policies,
            budgetPolicies,
            upcoming: data?.upcoming ?? [],
            status: LoadableStatus.Loaded,
          });
        } catch {
          if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setData: (policies, upcoming, budgetPolicies) =>
        set({
          policies,
          budgetPolicies: budgetPolicies ?? policies,
          upcoming,
          status: LoadableStatus.Loaded,
        }),

      upsertPolicy: (policy) =>
        set((state) => {
          const exists = state.policies.some((p) => p.id === policy.id);
          const policies = exists
            ? state.policies.map((p) => (p.id === policy.id ? policy : p))
            : [...state.policies, policy].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
          return {
            policies,
            budgetPolicies: syncBudgetPolicies(state.budgetPolicies, policy),
          };
        }),

      removePolicy: (id) =>
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
          upcoming: state.upcoming.filter((u) => u.policyId !== id),
        })),

      markPolicyDeleted: (policy) =>
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== policy.id),
          budgetPolicies: syncBudgetPolicies(state.budgetPolicies, policy),
          upcoming: state.upcoming.filter((u) => u.policyId !== policy.id),
        })),

      reset: () => set(initial),
    }),
    { name: 'insurance' },
  ),
);

export const useInsuranceStore = insuranceStore;
