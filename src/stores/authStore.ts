// src/stores/authStore.ts — full file
import { supabase } from "@/services/supabase";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type Role = "owner" | "staff";
type Profile = { id: string; full_name: string | null; role: Role };

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {
    await supabase.auth.signOut();
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();
  if (error) {
    console.warn("Failed to load profile", error.message);
    return null;
  }
  return data as Profile;
}

async function handleSession(session: Session | null) {
  // First update the auth state.
  useAuthStore.setState({
    session,
    profile: null,
    isLoading: true,
  });

  // Don't run the database query while inside onAuthStateChange.
  if (!session) {
    useAuthStore.setState({
      session: null,
      profile: null,
      isLoading: false,
    });

    return;
  }

  // Run profile query after the auth callback has returned.
  setTimeout(async () => {
    const profile = await fetchProfile(session.user.id);

    useAuthStore.setState({
      session,
      profile,
      isLoading: false,
    });
  }, 0);
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

