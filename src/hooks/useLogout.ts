import { removeAuthToken } from '@/helpers/auth-token';
import { useAuthStore } from '@/stores/useAuthStore';

export function useLogout() {
  const logout = useAuthStore((store) => store.logout);

  return { logout };
}
