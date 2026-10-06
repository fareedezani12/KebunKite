import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNeeds, useProfile, useUser } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading, PageHeader } from "@/components/kebun";
import { ChoiceGroup, NeedsPicker } from "@/components/NeedsPicker";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({ meta: [{ title: "Profile setup — KebunKite" }, { name: "description", content: "Tell KebunKite about your household and food needs." }] }),
  component: Setup,
});

const TECH = ["Pot", "Soil", "Hydroponics"] as const;
const SKILL = ["Beginner", "Intermediate", "Expert"] as const;

function Setup() {
  const user = useUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useProfile();
  const needs = useNeeds();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ full_name: "", household_members: "4", location: "", farming_technique: "" as string, growing_area: "20", skill_level: "" as string });
  const [picked, setPicked] = useState<Record<string, number>>({});

  useEffect(() => {
    const p = profile.data;
    if (p) setF((s) => ({
      full_name: p.full_name ?? s.full_name,
      household_members: String(p.household_members ?? s.household_members),
      location: p.location ?? s.location,
      farming_technique: p.farming_technique ?? s.farming_technique,
      growing_area: String(p.growing_area ?? s.growing_area),
      skill_level: p.skill_level ?? s.skill_level,
    }));
  }, [profile.data]);
  useEffect(() => {
    if (needs.data?.length) setPicked(Object.fromEntries(needs.data.map((n) => [n.crop_name, n.quantity_needed])));
  }, [needs.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.farming_technique || !f.skill_level) return toast.error("Choose a farming technique and skill level.");
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: f.full_name.trim(),
        household_members: Number(f.household_members) || 1,
        location: f.location.trim(),
        farming_technique: f.farming_technique,
        growing_area: Number(f.growing_area) || 0,
        skill_level: f.skill_level,
      });
      if (error) throw error;
      await supabase.from("household_needs").delete().eq("user_id", user.id);
      const rows = Object.entries(picked).map(([crop_name, quantity_needed]) => ({ user_id: user.id, crop_name, quantity_needed }));
      if (rows.length) {
        const { error: e2 } = await supabase.from("household_needs").insert(rows);
        if (e2) throw e2;
      }
      await qc.invalidateQueries();
      toast.success("Profile saved");
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (profile.isLoading) return <Loading />;

  return (
    <form onSubmit={save} className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Set up your household" subtitle="This helps KebunKite plan what your community should grow." />
      <div className="card-surface space-y-4 p-5">
        <div className="space-y-1.5"><Label>Full Name</Label><Input className="h-11" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Household Members</Label><Input className="h-11" type="number" min={1} value={f.household_members} onChange={(e) => setF({ ...f, household_members: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Growing Area (m²)</Label><Input className="h-11" type="number" min={1} value={f.growing_area} onChange={(e) => setF({ ...f, growing_area: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Location</Label><Input className="h-11" placeholder="Klang, Selangor" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Farming Technique</Label><ChoiceGroup options={TECH} value={f.farming_technique as never} onChange={(v) => setF({ ...f, farming_technique: v })} /></div>
        <div className="space-y-1.5"><Label>Skill Level</Label><ChoiceGroup options={SKILL} value={f.skill_level as never} onChange={(v) => setF({ ...f, skill_level: v })} /></div>
      </div>
      <div className="card-surface space-y-3 p-5">
        <div>
          <h2 className="font-semibold">Household Food Needs</h2>
          <p className="text-sm text-muted-foreground">Pick the crops your household eats and how many plants you need.</p>
        </div>
        <NeedsPicker value={picked} onChange={setPicked} />
      </div>
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
    </form>
  );
}
