'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { getCurrentMonth, getCurrentYear, today } from '@/lib/dates';
import type { Meter, MeterReading } from '@/types';
import type { MeterTemplate, MetersSettings } from '@/lib/metersSettings';

interface MetersUiState {
  expandedHistory: Record<number, boolean>;
  expandedFullHistory: Record<number, boolean>;
  calcValues: Record<number, string>;

  isNewMeterModalOpen: boolean;
  newMeterName: string;
  newMeterUnit: string;
  newMeterLoc: string;

  isReadingModalOpen: boolean;
  editingReading: { meter: Meter; reading: MeterReading } | null;
  meterId: number;
  date: string;
  value: string;
  isReset: boolean;
  isOfficial: boolean;

  isAiModalOpen: boolean;
  isAiLoading: boolean;
  aiTargetMeter: number;
  aiYear: number;
  aiMonth: number;
}

interface MetersUiActions {
  toggleHistory: (meterId: number) => void;
  toggleFullHistory: (meterId: number) => void;
  expandFullHistory: (meterId: number) => void;
  setCalcValue: (meterId: number, value: string) => void;

  openNewMeterModal: (settings: MetersSettings) => void;
  closeNewMeterModal: () => void;
  setNewMeterName: (value: string) => void;
  setNewMeterUnit: (value: string) => void;
  setNewMeterLoc: (value: string) => void;
  applyMeterTemplate: (template: MeterTemplate, settings: MetersSettings) => void;

  openAddReading: (meter: Meter) => void;
  openEditReading: (meter: Meter, reading: MeterReading) => void;
  closeReadingModal: () => void;
  setMeterId: (id: number) => void;
  setDate: (date: string) => void;
  setValue: (value: string) => void;
  setIsReset: (value: boolean) => void;
  setIsOfficial: (value: boolean) => void;

  openAiModal: (meterId: number) => void;
  closeAiModal: () => void;
  setAiYear: (year: number) => void;
  setAiMonth: (month: number) => void;
  setIsAiLoading: (value: boolean) => void;
}

export type MetersUiContextValue = MetersUiState & MetersUiActions;

type MetersUiAction =
  | { type: 'TOGGLE_HISTORY'; meterId: number }
  | { type: 'TOGGLE_FULL_HISTORY'; meterId: number }
  | { type: 'EXPAND_FULL_HISTORY'; meterId: number }
  | { type: 'SET_CALC_VALUE'; meterId: number; value: string }
  | { type: 'OPEN_NEW_METER_MODAL'; settings: MetersSettings }
  | { type: 'CLOSE_NEW_METER_MODAL' }
  | { type: 'SET_NEW_METER_NAME'; value: string }
  | { type: 'SET_NEW_METER_UNIT'; value: string }
  | { type: 'SET_NEW_METER_LOC'; value: string }
  | { type: 'APPLY_METER_TEMPLATE'; template: MeterTemplate; settings: MetersSettings }
  | { type: 'OPEN_ADD_READING'; meter: Meter }
  | { type: 'OPEN_EDIT_READING'; meter: Meter; reading: MeterReading }
  | { type: 'CLOSE_READING_MODAL' }
  | { type: 'SET_METER_ID'; id: number }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_VALUE'; value: string }
  | { type: 'SET_IS_RESET'; value: boolean }
  | { type: 'SET_IS_OFFICIAL'; value: boolean }
  | { type: 'OPEN_AI_MODAL'; meterId: number }
  | { type: 'CLOSE_AI_MODAL' }
  | { type: 'SET_AI_YEAR'; year: number }
  | { type: 'SET_AI_MONTH'; month: number }
  | { type: 'SET_IS_AI_LOADING'; value: boolean };

const INITIAL_UI_STATE: MetersUiState = {
  expandedHistory: {},
  expandedFullHistory: {},
  calcValues: {},

  isNewMeterModalOpen: false,
  newMeterName: '',
  newMeterUnit: 'kWh',
  newMeterLoc: '',

  isReadingModalOpen: false,
  editingReading: null,
  meterId: 0,
  date: today(),
  value: '',
  isReset: false,
  isOfficial: false,

  isAiModalOpen: false,
  isAiLoading: false,
  aiTargetMeter: 1,
  aiYear: getCurrentYear(),
  aiMonth: getCurrentMonth(),
};

function metersUiReducer(state: MetersUiState, action: MetersUiAction): MetersUiState {
  switch (action.type) {
    case 'TOGGLE_HISTORY':
      return {
        ...state,
        expandedHistory: {
          ...state.expandedHistory,
          [action.meterId]: !state.expandedHistory[action.meterId],
        },
      };
    case 'TOGGLE_FULL_HISTORY':
      return {
        ...state,
        expandedFullHistory: {
          ...state.expandedFullHistory,
          [action.meterId]: !state.expandedFullHistory[action.meterId],
        },
      };
    case 'EXPAND_FULL_HISTORY':
      return {
        ...state,
        expandedFullHistory: { ...state.expandedFullHistory, [action.meterId]: true },
      };
    case 'SET_CALC_VALUE':
      return {
        ...state,
        calcValues: { ...state.calcValues, [action.meterId]: action.value },
      };

    case 'OPEN_NEW_METER_MODAL':
      return {
        ...state,
        newMeterName: '',
        newMeterUnit: action.settings.units[0] ?? 'kWh',
        newMeterLoc: action.settings.default_location,
        isNewMeterModalOpen: true,
      };
    case 'CLOSE_NEW_METER_MODAL':
      return { ...state, isNewMeterModalOpen: false, newMeterName: '' };
    case 'SET_NEW_METER_NAME':
      return { ...state, newMeterName: action.value };
    case 'SET_NEW_METER_UNIT':
      return { ...state, newMeterUnit: action.value };
    case 'SET_NEW_METER_LOC':
      return { ...state, newMeterLoc: action.value };
    case 'APPLY_METER_TEMPLATE':
      return {
        ...state,
        newMeterName: action.template.name,
        newMeterUnit: action.template.unit,
        newMeterLoc: action.template.location || action.settings.default_location,
      };

    case 'OPEN_ADD_READING':
      return {
        ...state,
        editingReading: null,
        meterId: action.meter.id,
        value: '',
        date: today(),
        isReset: false,
        isOfficial: false,
        isReadingModalOpen: true,
      };
    case 'OPEN_EDIT_READING':
      return {
        ...state,
        editingReading: { meter: action.meter, reading: action.reading },
        meterId: action.meter.id,
        date: action.reading.date,
        value: action.reading.value.toString(),
        isReset: action.reading.isReset,
        isOfficial: action.reading.isOfficial || false,
        isReadingModalOpen: true,
      };
    case 'CLOSE_READING_MODAL':
      return {
        ...state,
        isReadingModalOpen: false,
        editingReading: null,
        value: '',
        isReset: false,
        isOfficial: false,
      };
    case 'SET_METER_ID':
      return { ...state, meterId: action.id };
    case 'SET_DATE':
      return { ...state, date: action.date };
    case 'SET_VALUE':
      return { ...state, value: action.value };
    case 'SET_IS_RESET':
      return { ...state, isReset: action.value };
    case 'SET_IS_OFFICIAL':
      return { ...state, isOfficial: action.value };

    case 'OPEN_AI_MODAL':
      return { ...state, aiTargetMeter: action.meterId, isAiModalOpen: true };
    case 'CLOSE_AI_MODAL':
      return { ...state, isAiModalOpen: false };
    case 'SET_AI_YEAR':
      return { ...state, aiYear: action.year };
    case 'SET_AI_MONTH':
      return { ...state, aiMonth: action.month };
    case 'SET_IS_AI_LOADING':
      return { ...state, isAiLoading: action.value };

    default:
      return state;
  }
}

const MetersUiContext = createContext<MetersUiContextValue | null>(null);

export function MetersUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(metersUiReducer, INITIAL_UI_STATE);

  const toggleHistory = useCallback((meterId: number) => {
    dispatch({ type: 'TOGGLE_HISTORY', meterId });
  }, []);

  const toggleFullHistory = useCallback((meterId: number) => {
    dispatch({ type: 'TOGGLE_FULL_HISTORY', meterId });
  }, []);

  const expandFullHistory = useCallback((meterId: number) => {
    dispatch({ type: 'EXPAND_FULL_HISTORY', meterId });
  }, []);

  const setCalcValue = useCallback((meterId: number, value: string) => {
    dispatch({ type: 'SET_CALC_VALUE', meterId, value });
  }, []);

  const openNewMeterModal = useCallback((settings: MetersSettings) => {
    dispatch({ type: 'OPEN_NEW_METER_MODAL', settings });
  }, []);

  const closeNewMeterModal = useCallback(() => {
    dispatch({ type: 'CLOSE_NEW_METER_MODAL' });
  }, []);

  const setNewMeterName = useCallback((value: string) => {
    dispatch({ type: 'SET_NEW_METER_NAME', value });
  }, []);

  const setNewMeterUnit = useCallback((value: string) => {
    dispatch({ type: 'SET_NEW_METER_UNIT', value });
  }, []);

  const setNewMeterLoc = useCallback((value: string) => {
    dispatch({ type: 'SET_NEW_METER_LOC', value });
  }, []);

  const applyMeterTemplate = useCallback((template: MeterTemplate, settings: MetersSettings) => {
    dispatch({ type: 'APPLY_METER_TEMPLATE', template, settings });
  }, []);

  const openAddReading = useCallback((meter: Meter) => {
    dispatch({ type: 'OPEN_ADD_READING', meter });
  }, []);

  const openEditReading = useCallback((meter: Meter, reading: MeterReading) => {
    dispatch({ type: 'OPEN_EDIT_READING', meter, reading });
  }, []);

  const closeReadingModal = useCallback(() => {
    dispatch({ type: 'CLOSE_READING_MODAL' });
  }, []);

  const setMeterId = useCallback((id: number) => {
    dispatch({ type: 'SET_METER_ID', id });
  }, []);

  const setDate = useCallback((date: string) => {
    dispatch({ type: 'SET_DATE', date });
  }, []);

  const setValue = useCallback((value: string) => {
    dispatch({ type: 'SET_VALUE', value });
  }, []);

  const setIsReset = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_RESET', value });
  }, []);

  const setIsOfficial = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_OFFICIAL', value });
  }, []);

  const openAiModal = useCallback((meterId: number) => {
    dispatch({ type: 'OPEN_AI_MODAL', meterId });
  }, []);

  const closeAiModal = useCallback(() => {
    dispatch({ type: 'CLOSE_AI_MODAL' });
  }, []);

  const setAiYear = useCallback((year: number) => {
    dispatch({ type: 'SET_AI_YEAR', year });
  }, []);

  const setAiMonth = useCallback((month: number) => {
    dispatch({ type: 'SET_AI_MONTH', month });
  }, []);

  const setIsAiLoading = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_AI_LOADING', value });
  }, []);

  const value: MetersUiContextValue = {
    ...state,
    toggleHistory,
    toggleFullHistory,
    expandFullHistory,
    setCalcValue,
    openNewMeterModal,
    closeNewMeterModal,
    setNewMeterName,
    setNewMeterUnit,
    setNewMeterLoc,
    applyMeterTemplate,
    openAddReading,
    openEditReading,
    closeReadingModal,
    setMeterId,
    setDate,
    setValue,
    setIsReset,
    setIsOfficial,
    openAiModal,
    closeAiModal,
    setAiYear,
    setAiMonth,
    setIsAiLoading,
  };

  return <MetersUiContext.Provider value={value}>{children}</MetersUiContext.Provider>;
}

export function useMetersUi(): MetersUiContextValue {
  const ctx = useContext(MetersUiContext);
  if (!ctx) {
    throw new Error('useMetersUi must be used within a <MetersUiProvider>');
  }
  return ctx;
}
