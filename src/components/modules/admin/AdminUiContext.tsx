'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type { AdminLifetimeAdminFilter, AdminUser, AdminUserStatusFilter } from '@/types/admin';

interface AdminUiState {
  search: string;
  statusFilter: AdminUserStatusFilter;
  lifetimeAdminFilter: AdminLifetimeAdminFilter;
  page: number;
  drawerOpen: boolean;
  selectedUser: AdminUser | null;
  activateTarget: AdminUser | null;
  deactivateTarget: AdminUser | null;
  impersonateTarget: AdminUser | null;
}

interface AdminUiActions {
  setSearch: (search: string) => void;
  setStatusFilter: (filter: AdminUserStatusFilter) => void;
  setLifetimeAdminFilter: (filter: AdminLifetimeAdminFilter) => void;
  setPage: (page: number) => void;
  openUserDrawer: (user: AdminUser) => void;
  closeUserDrawer: () => void;
  openActivateModal: (user: AdminUser) => void;
  closeActivateModal: () => void;
  openDeactivateModal: (user: AdminUser) => void;
  closeDeactivateModal: () => void;
  openImpersonateModal: (user: AdminUser) => void;
  closeImpersonateModal: () => void;
}

export type AdminUiContextValue = AdminUiState & AdminUiActions;

type AdminUiAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_STATUS_FILTER'; value: AdminUserStatusFilter }
  | { type: 'SET_LIFETIME_ADMIN_FILTER'; value: AdminLifetimeAdminFilter }
  | { type: 'SET_PAGE'; value: number }
  | { type: 'OPEN_USER_DRAWER'; user: AdminUser }
  | { type: 'CLOSE_USER_DRAWER' }
  | { type: 'OPEN_ACTIVATE_MODAL'; user: AdminUser }
  | { type: 'CLOSE_ACTIVATE_MODAL' }
  | { type: 'OPEN_DEACTIVATE_MODAL'; user: AdminUser }
  | { type: 'CLOSE_DEACTIVATE_MODAL' }
  | { type: 'OPEN_IMPERSONATE_MODAL'; user: AdminUser }
  | { type: 'CLOSE_IMPERSONATE_MODAL' };

const INITIAL_UI_STATE: AdminUiState = {
  search: '',
  statusFilter: 'all',
  lifetimeAdminFilter: 'all',
  page: 1,
  drawerOpen: false,
  selectedUser: null,
  activateTarget: null,
  deactivateTarget: null,
  impersonateTarget: null,
};

function adminUiReducer(state: AdminUiState, action: AdminUiAction): AdminUiState {
  switch (action.type) {
    case 'SET_SEARCH':
      if (state.search === action.value) return state;
      return { ...state, search: action.value, page: 1 };
    case 'SET_STATUS_FILTER':
      if (state.statusFilter === action.value) return state;
      return { ...state, statusFilter: action.value, page: 1 };
    case 'SET_LIFETIME_ADMIN_FILTER':
      if (state.lifetimeAdminFilter === action.value) return state;
      return { ...state, lifetimeAdminFilter: action.value, page: 1 };
    case 'SET_PAGE':
      if (state.page === action.value) return state;
      return { ...state, page: action.value };
    case 'OPEN_USER_DRAWER':
      return { ...state, drawerOpen: true, selectedUser: action.user };
    case 'CLOSE_USER_DRAWER':
      return { ...state, drawerOpen: false, selectedUser: null };
    case 'OPEN_ACTIVATE_MODAL':
      return { ...state, activateTarget: action.user };
    case 'CLOSE_ACTIVATE_MODAL':
      return { ...state, activateTarget: null };
    case 'OPEN_DEACTIVATE_MODAL':
      return { ...state, deactivateTarget: action.user };
    case 'CLOSE_DEACTIVATE_MODAL':
      return { ...state, deactivateTarget: null };
    case 'OPEN_IMPERSONATE_MODAL':
      return { ...state, impersonateTarget: action.user };
    case 'CLOSE_IMPERSONATE_MODAL':
      return { ...state, impersonateTarget: null };
    default:
      return state;
  }
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null);

export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminUiReducer, INITIAL_UI_STATE);

  const setSearch = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH', value });
  }, []);

  const setStatusFilter = useCallback((value: AdminUserStatusFilter) => {
    dispatch({ type: 'SET_STATUS_FILTER', value });
  }, []);

  const setLifetimeAdminFilter = useCallback((value: AdminLifetimeAdminFilter) => {
    dispatch({ type: 'SET_LIFETIME_ADMIN_FILTER', value });
  }, []);

  const setPage = useCallback((value: number) => {
    dispatch({ type: 'SET_PAGE', value });
  }, []);

  const openUserDrawer = useCallback((user: AdminUser) => {
    dispatch({ type: 'OPEN_USER_DRAWER', user });
  }, []);

  const closeUserDrawer = useCallback(() => {
    dispatch({ type: 'CLOSE_USER_DRAWER' });
  }, []);

  const openActivateModal = useCallback((user: AdminUser) => {
    dispatch({ type: 'OPEN_ACTIVATE_MODAL', user });
  }, []);

  const closeActivateModal = useCallback(() => {
    dispatch({ type: 'CLOSE_ACTIVATE_MODAL' });
  }, []);

  const openDeactivateModal = useCallback((user: AdminUser) => {
    dispatch({ type: 'OPEN_DEACTIVATE_MODAL', user });
  }, []);

  const closeDeactivateModal = useCallback(() => {
    dispatch({ type: 'CLOSE_DEACTIVATE_MODAL' });
  }, []);

  const openImpersonateModal = useCallback((user: AdminUser) => {
    dispatch({ type: 'OPEN_IMPERSONATE_MODAL', user });
  }, []);

  const closeImpersonateModal = useCallback(() => {
    dispatch({ type: 'CLOSE_IMPERSONATE_MODAL' });
  }, []);

  const value: AdminUiContextValue = {
    ...state,
    setSearch,
    setStatusFilter,
    setLifetimeAdminFilter,
    setPage,
    openUserDrawer,
    closeUserDrawer,
    openActivateModal,
    closeActivateModal,
    openDeactivateModal,
    closeDeactivateModal,
    openImpersonateModal,
    closeImpersonateModal,
  };

  return <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>;
}

export function useAdminUi(): AdminUiContextValue {
  const ctx = useContext(AdminUiContext);
  if (!ctx) {
    throw new Error('useAdminUi must be used within AdminUiProvider');
  }
  return ctx;
}
