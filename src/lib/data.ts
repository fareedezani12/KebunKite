import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  return user;
}

export function useProfile() {
  const user = useUser();
  return useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useNeeds() {
  const user = useUser();
  return useQuery({
    queryKey: ["needs", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("household_needs").select("*").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });
}

export function useCrops() {
  return useQuery({
    queryKey: ["crops"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from("crops").select("*").order("crop_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*, community_members(count)")
        .order("created_at");
      if (error) throw error;
      return data.map((c) => ({
        ...c,
        memberCount: (c.community_members as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));
    },
  });
}

export function useMemberships() {
  const user = useUser();
  return useQuery({
    queryKey: ["memberships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("*, communities(*)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** The user's most recently joined community. */
export function useCurrentCommunity() {
  const q = useMemberships();
  return { ...q, community: q.data?.[0]?.communities ?? null };
}

export function useMemberCount(communityId?: string | null) {
  return useQuery({
    queryKey: ["memberCount", communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useLatestPlan(communityId?: string | null) {
  const user = useUser();
  return useQuery({
    queryKey: ["latestPlan", user.id, communityId ?? "any"],
    queryFn: async () => {
      let q = supabase
        .from("crop_plans")
        .select("*, communities(name), crop_recommendations(*, crops(*))")
        .order("created_at", { ascending: false })
        .limit(1);
      if (communityId) q = q.eq("community_id", communityId);
      const { data, error } = await q;
      if (error) throw error;
      return data[0] ?? null;
    },
  });
}

export function useSchedule() {
  const user = useUser();
  // RLS returns the user's own schedule plus schedules from their communities' plans
  return useQuery({
    queryKey: ["schedule", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planting_schedule")
        .select("*, crops(crop_name)")
        .order("planting_date");
      if (error) throw error;
      return data;
    },
  });
}

export function useHarvests(communityId?: string | null) {
  const user = useUser();
  return useQuery({
    queryKey: ["harvests", user.id, communityId ?? "mine"],
    queryFn: async () => {
      let q = supabase
        .from("harvest_outputs")
        .select("*, crops(crop_name), communities(name)")
        .order("harvest_date", { ascending: false })
        .order("created_at", { ascending: false });
      q = communityId ? q.eq("community_id", communityId) : q.eq("household_id", user.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function sumKg<T extends { quantity_kg: number | string; surplus_kg: number | string }>(rows: T[] = []) {
  const output = rows.reduce((s, r) => s + Number(r.quantity_kg || 0), 0);
  const surplus = rows.reduce((s, r) => s + Number(r.surplus_kg || 0), 0);
  return { output: Math.round(output * 10) / 10, surplus: Math.round(surplus * 10) / 10 };
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export type PublicProfile = { id: string; full_name: string | null; profile_photo: string | null };

/** Name + photo for any users (safe subset, via a security-definer function). */
export function usePublicProfiles(ids: (string | null | undefined)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[])).sort();
  return useQuery({
    queryKey: ["publicProfiles", unique.join(",")],
    enabled: unique.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profiles", { _ids: unique });
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.id, p as PublicProfile]));
    },
  });
}

export function initials(name?: string | null) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}
