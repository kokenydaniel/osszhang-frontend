import { removeAuthToken } from '@/lib/authToken';
import { useAuthStore } from '@/stores/useAuthStore';

export function useLogout() {
  const logout = useAuthStore((store) => store.logout);

  return { logout };
}
