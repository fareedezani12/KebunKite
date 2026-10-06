import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Users, Ruler, Sprout, GraduationCap, Wheat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty, Loading, PageHeader } from "@/components/kebun";
import { ChoiceGroup, NeedsPicker } from "@/components/NeedsPicker";
import { useCrops, useMemberships, useNeeds, useProfile, useUser } from "@/lib/data";
import { generatePlan, type Skill, type Technique } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Community Kebun Planner — KebunKite" }, { name: "description", content: "Generate a practical crop plan from your community's food needs." }] }),
  component: Planner,
});

const TECH = ["Pot", "Soil", "Hydroponics"] as const;
const SKILL = ["Beginner", "Intermediate", "Expert"] as const;

function Planner() {
  const user = useUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const memberships = useMemberships();
  const profile = useProfile();
  const needsQ = useNeeds();
  const crops = useCrops();
  const [busy, setBusy] = useState(false);
  const [communityId, setCommunityId] = useState("");
  const [members, setMembers] = useState("4");
  const [area, setArea] = useState("20");
  const [tech, setTech] = useState<Technique | "">("Soil");
  const [skill, setSkill] = useState<Skill | "">("Beginner");
  const [needs, setNeeds] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!communityId && memberships.data?.[0]) setCommunityId(memberships.data[0].community_id);
  }, [memberships.data, communityId]);
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    if (p.household_members) setMembers(String(p.household_members));
    if (p.growing_area) setArea(String(p.growing_area));
    if (p.farming_technique) setTech(p.farming_technique as Technique);
    if (p.skill_level) setSkill(p.skill_level as Skill);
  }, [profile.data]);
  useEffect(() => {
    if (needsQ.data?.length) setNeeds(Object.fromEntries(needsQ.data.map((n) => [n.crop_name, n.quantity_needed])));
  }, [needsQ.data]);

  async function generate() {
    if (!communityId) return toast.error("Choose a community first.");
    if (!tech || !skill) return toast.error("Choose a technique and skill level.");
    if (!Object.keys(needs).length) return toast.error("Select at least one crop your community needs.");
    setBusy(true);
    try {
      const recs = generatePlan({ householdMembers: Number(members), growingArea: Number(area), technique: tech, skill, needs });
      if (!recs.length) throw new Error("Not enough growing area for a plan. Try a larger area.");
      const { data: plan, error } = await supabase
        .from("crop_plans")
        .insert({ community_id: communityId, created_by: user.id, farming_technique: tech, community_skill_level: skill, status: "active" })
        .select()
        .single();
      if (error) throw error;
      const byName = new Map((crops.data ?? []).map((c) => [c.crop_name, c.id]));
      const rows = recs.map((r) => ({
        crop_plan_id: plan.id,
        household_id: user.id,
        crop_id: byName.get(r.crop) ?? null,
        recommended_quantity: r.quantity,
        estimated_harvest_days: r.harvestDays,
        status: "pending",
        reason: r.reason,
        suitability: r.suitability,
      }));
      const { error: e2 } = await supabase.from("crop_recommendations").insert(rows);
      if (e2) throw e2;
      await qc.invalidateQueries();
      toast.success(`Plan ready — ${recs.length} crops recommended`);
      navigate({ to: "/recommendations" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate plan");
    } finally {
      setBusy(false);
    }
  }

  if (memberships.isLoading || profile.isLoading) return <Loading />;

  if (!memberships.data?.length) {
    return (
      <div>
        <PageHeader title="Community Kebun Planner" subtitle="Grow what your community needs." />
        <Empty icon={Users} title="Join a community first" text="Plans are created for a community, so neighbours can grow together." action={<Button asChild><Link to="/communities">Discover communities</Link></Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Community Kebun Planner" subtitle="Grow what your community needs." />
      <div className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        <Sparkles className="mb-1 h-4 w-4" />
        KebunKite combines household food needs, growing capacity, farming technique and community skill level to create a practical crop plan.
      </div>

      <div className="card-surface space-y-4 p-5">
        <div className="space-y-1.5">
          <Label>Community</Label>
          <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
            {memberships.data.map((m) => <option key={m.community_id} value={m.community_id}>{m.communities?.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Household Members</Label><Input className="h-11" type="number" min={1} value={members} onChange={(e) => setMembers(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />Growing Area (m²)</Label><Input className="h-11" type="number" min={1} value={area} onChange={(e) => setArea(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label className="flex items-center gap-1"><Sprout className="h-3.5 w-3.5" />Farming Technique</Label><ChoiceGroup options={TECH} value={tech} onChange={setTech} /></div>
        <div className="space-y-1.5"><Label className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />Community Skill Level</Label><ChoiceGroup options={SKILL} value={skill} onChange={setSkill} /></div>
      </div>

      <div className="card-surface space-y-3 p-5">
        <Label className="flex items-center gap-1"><Wheat className="h-3.5 w-3.5" />Food Needs</Label>
        <NeedsPicker value={needs} onChange={setNeeds} />
      </div>

      <Button onClick={generate} size="lg" className="h-12 w-full text-base" disabled={busy}>
        <Sparkles className="mr-1 h-4 w-4" />{busy ? "Generating plan…" : "Generate Community Plan"}
      </Button>
      <Link to="/recommendations" className="block text-center text-sm font-medium text-fresh">View latest plan</Link>
    </div>
  );
}
