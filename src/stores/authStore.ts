// src/stores/authStore.ts — full file
import { supabase } from "@/services/supabase";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type Role = "seller" | "customer";
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

// Initial session
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error("Failed to get session:", error);

    useAuthStore.setState({
      session: null,
      profile: null,
      isLoading: false,
    });

    return;
  }

  handleSession(session);
});

// Auth changes
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  handleSession(session);
});

export { subscription };

