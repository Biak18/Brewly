// src/stores/authStore.ts: full file
import { supabase } from "@/services/supabase";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { useCartStore } from "./cartStore";

type Role = "seller" | "customer" | "driver";
type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  profile: null,
  isLoading: true,
  isPasswordRecovery: false,
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    useAuthStore.setState({
      session: null,
      profile: null,
      isPasswordRecovery: false,
      isLoading: false,
    });
    useCartStore.getState().setCartUser(null);
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("Failed to load profile", error.message);
    return null;
  }
  return data as Profile;
}

export async function refreshProfile() {
  const session = useAuthStore.getState().session;
  if (!session) return;
  const profile = await fetchProfile(session.user.id);
  useAuthStore.setState({ profile });
}

let sessionRequestId = 0;

async function handleSession(session: Session | null) {
  const requestId = ++sessionRequestId;
  useCartStore.getState().setCartUser(session?.user.id ?? null);

  useAuthStore.setState({
    session,
    profile: null,
    isLoading: true,
  });

  if (!session) {
    useAuthStore.setState({
      session: null,
      profile: null,
      isLoading: false,
    });

    return;
  }

  const profile = await fetchProfile(session.user.id);
  if (requestId !== sessionRequestId) return;

  useAuthStore.setState({
    session,
    profile,
    isLoading: false,
  });
}

// Initial session with refresh-token failure handling
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error("Failed to get session:", error.message);
    // Refresh token invalid/expired: clear stale session so guards route to sign-in
    // instead of hanging on isLoading. Supabase already clears storage, we just
    // ensure local state matches.
    useAuthStore.setState({
      session: null,
      profile: null,
      isLoading: false,
      isPasswordRecovery: false,
    });
    useCartStore.getState().setCartUser(null);
    return;
  }

  handleSession(session);
});

// Auth changes with explicit recovery and refresh-failure handling
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  // Password recovery sessions are flagged so RootNavigator routes to reset-password
  if (event === "PASSWORD_RECOVERY") {
    useAuthStore.setState({ isPasswordRecovery: true });
  }
  if (event === "SIGNED_OUT" || (event as string) === "TOKEN_REFRESH_FAILED") {
    // Token refresh failed means the refresh token is revoked/expired
    // (e.g. password changed elsewhere, leaked token rotation). Force sign-out
    // state so the user is not stuck on a loading screen.
    if (!session) {
      useAuthStore.setState({
        session: null,
        profile: null,
        isLoading: false,
        isPasswordRecovery: false,
      });
      useCartStore.getState().setCartUser(null);
      return;
    }
  }
  handleSession(session);
});

export { subscription };
