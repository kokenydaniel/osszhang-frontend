'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addCustomLineItem,
  applyCostLineItemsToPlan,
  initializeCostLineItems,
  removeLineItem,
  setLineItemStatus,
  summarizeCostLineItems,
  updateLineItemAmount,
  updateLineItemLabel,
  updateLineItemSplit,
} from '@/calculations/travel-cost-adjustments';
import type { AiTravelPlan } from '@/types/ai';
import type { TravelCostLineItem, TravelCostLineItemStatus } from '@/types/travel';
import { travelClient } from '@/lib/api-client';

type UseTravelCostAdjustmentsOptions = {
  plan: AiTravelPlan;
  targetDate?: string | null;
  onPlanChange: (plan: AiTravelPlan) => void;
};

export function useTravelCostAdjustments({ plan, targetDate, onPlanChange }: UseTravelCostAdjustmentsOptions) {
  const [basePlan] = useState(() => plan);
  const [lineItems, setLineItems] = useState<TravelCostLineItem[]>(() => initializeCostLineItems(plan));
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adjustedPlan = useMemo(
    () => applyCostLineItemsToPlan(basePlan, lineItems, targetDate),
    [basePlan, lineItems, targetDate],
  );

  const costSummary = useMemo(() => summarizeCostLineItems(lineItems), [lineItems]);

  useEffect(() => {
    onPlanChange(adjustedPlan);
  }, [adjustedPlan, onPlanChange]);

  const persistAdjustments = useCallback(
    (nextPlan: AiTravelPlan) => {
      if (!nextPlan.saved_plan_id) return;

      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }

      persistTimerRef.current = setTimeout(() => {
        void travelClient.updateCostAdjustments(nextPlan.saved_plan_id!, {
          cost_line_items: nextPlan.cost_line_items ?? [],
          total_estimated_cost: nextPlan.total_estimated_cost,
          remaining_to_pay_huf: nextPlan.remaining_to_pay_huf ?? nextPlan.total_estimated_cost,
          paid_total_huf: nextPlan.paid_total_huf ?? 0,
          cost_breakdown: nextPlan.cost_breakdown,
          financial_fit: nextPlan.financial_fit,
        });
      }, 700);
    },
    [],
  );

  useEffect(() => {
    persistAdjustments(adjustedPlan);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [adjustedPlan, persistAdjustments]);

  const commitItems = useCallback((updater: (items: TravelCostLineItem[]) => TravelCostLineItem[]) => {
    setLineItems((current) => updater(current));
  }, []);

  return {
    lineItems,
    adjustedPlan,
    costSummary,
    setItemStatus: (id: string, status: TravelCostLineItemStatus) =>
      commitItems((items) => setLineItemStatus(items, id, status)),
    setItemAmount: (id: string, amount: number) =>
      commitItems((items) => updateLineItemAmount(items, id, amount)),
    setItemLabel: (id: string, label: string) =>
      commitItems((items) => updateLineItemLabel(items, id, label)),
    setItemSplit: (id: string, splitEnabled: boolean, splitBetween?: number) =>
      commitItems((items) => updateLineItemSplit(items, id, splitEnabled, splitBetween)),
    removeItem: (id: string) => commitItems((items) => removeLineItem(items, id)),
    addItem: () => commitItems((items) => addCustomLineItem(items)),
  };
}
