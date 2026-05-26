'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type { AiTravelPlan } from '@/types';

interface TravelUiState {
  destination: string;
  durationDays: string;
  totalBudget: string;
  targetDate: string;
  plan: AiTravelPlan | null;
  isGenerating: boolean;
  isSavingGoal: boolean;
}

interface TravelUiActions {
  setDestination: (value: string) => void;
  setDurationDays: (value: string) => void;
  setTotalBudget: (value: string) => void;
  setTargetDate: (value: string) => void;
  setPlan: (plan: AiTravelPlan | null) => void;
  setIsGenerating: (value: boolean) => void;
  setIsSavingGoal: (value: boolean) => void;
  resetPlan: () => void;
}

export type TravelUiContextValue = TravelUiState & TravelUiActions;

type TravelUiAction =
  | { type: 'SET_DESTINATION'; value: string }
  | { type: 'SET_DURATION_DAYS'; value: string }
  | { type: 'SET_TOTAL_BUDGET'; value: string }
  | { type: 'SET_TARGET_DATE'; value: string }
  | { type: 'SET_PLAN'; plan: AiTravelPlan | null }
  | { type: 'SET_IS_GENERATING'; value: boolean }
  | { type: 'SET_IS_SAVING_GOAL'; value: boolean }
  | { type: 'RESET_PLAN' };

const initialState: TravelUiState = {
  destination: '',
  durationDays: '5',
  totalBudget: '',
  targetDate: '',
  plan: null,
  isGenerating: false,
  isSavingGoal: false,
};

function travelUiReducer(state: TravelUiState, action: TravelUiAction): TravelUiState {
  switch (action.type) {
    case 'SET_DESTINATION':
      return { ...state, destination: action.value };
    case 'SET_DURATION_DAYS':
      return { ...state, durationDays: action.value };
    case 'SET_TOTAL_BUDGET':
      return { ...state, totalBudget: action.value };
    case 'SET_TARGET_DATE':
      return { ...state, targetDate: action.value };
    case 'SET_PLAN':
      return { ...state, plan: action.plan };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.value };
    case 'SET_IS_SAVING_GOAL':
      return { ...state, isSavingGoal: action.value };
    case 'RESET_PLAN':
      return { ...state, plan: null };
    default:
      return state;
  }
}

const TravelUiContext = createContext<TravelUiContextValue | null>(null);

export function TravelUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(travelUiReducer, initialState);

  const setDestination = useCallback((value: string) => {
    dispatch({ type: 'SET_DESTINATION', value });
  }, []);

  const setDurationDays = useCallback((value: string) => {
    dispatch({ type: 'SET_DURATION_DAYS', value });
  }, []);

  const setTotalBudget = useCallback((value: string) => {
    dispatch({ type: 'SET_TOTAL_BUDGET', value });
  }, []);

  const setTargetDate = useCallback((value: string) => {
    dispatch({ type: 'SET_TARGET_DATE', value });
  }, []);

  const setPlan = useCallback((plan: AiTravelPlan | null) => {
    dispatch({ type: 'SET_PLAN', plan });
  }, []);

  const setIsGenerating = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_GENERATING', value });
  }, []);

  const setIsSavingGoal = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_SAVING_GOAL', value });
  }, []);

  const resetPlan = useCallback(() => {
    dispatch({ type: 'RESET_PLAN' });
  }, []);

  const value: TravelUiContextValue = {
    ...state,
    setDestination,
    setDurationDays,
    setTotalBudget,
    setTargetDate,
    setPlan,
    setIsGenerating,
    setIsSavingGoal,
    resetPlan,
  };

  return <TravelUiContext.Provider value={value}>{children}</TravelUiContext.Provider>;
}

export function useTravelUi(): TravelUiContextValue {
  const ctx = useContext(TravelUiContext);
  if (!ctx) {
    throw new Error('useTravelUi must be used within TravelUiProvider');
  }
  return ctx;
}
