import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CalendarDays, SlidersHorizontal, Sprout, Clock, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Empty, ErrorState, Loading, PageHeader, SuitabilityBadge } from "@/components/kebun";
import { useLatestPlan, useUser } from "@/lib/data";
import { CROP_META, expectedKg, scheduleFor } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "Crop Recommendations — KebunKite" }, { name: "description", content: "Recommended crops, quantities and harvest times for your community." }] }),
  component: Recommendations,
});

type Rec = NonNullable<ReturnType<typeof useLatestPlan>["data"]>["crop_recommendations"][number];

function Recommendations() {
  const user = useUser();
  const qc = useQueryClient();
  const plan = useLatestPlan();
  const [adjust, setAdjust] = useState<Rec | null>(null);
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  async function accept(r: Rec) {
    setBusy(r.id);
    try {
      const { error } = await supabase.from("crop_recommendations").update({ status: "accepted" }).eq("id", r.id);
      if (error) throw error;
      const { count } = await supabase.from("planting_schedule").select("id", { count: "exact", head: true }).eq("recommendation_id", r.id);
      if (!count) {
        const rows = scheduleFor(r.crops?.crop_name ?? "").map((s) => ({
          ...s,
          recommendation_id: r.id,
          household_id: user.id,
          crop_id: r.crop_id,
          quantity: r.recommended_quantity,
          status: "Scheduled",
        }));
        const { error: e2 } = await supabase.from("planting_schedule").insert(rows);
        if (e2) throw e2;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept");
    } finally {
      setBusy(null);
    }
  }

  async function acceptAll(recs: Rec[]) {
    for (const r of recs.filter((x) => x.status !== "accepted")) await accept(r);
    await qc.invalidateQueries();
    toast.success("All crops accepted and scheduled");
  }

  async function saveAdjust() {
    if (!adjust) return;
    const n = Math.max(1, Number(qty) || 1);
    const { error } = await supabase.from("crop_recommendations").update({ recommended_quantity: n }).eq("id", adjust.id);
    if (error) return toast.error(error.message);
    await supabase.from("planting_schedule").update({ quantity: n }).eq("recommendation_id", adjust.id);
    await qc.invalidateQueries();
    setAdjust(null);
    toast.success("Quantity updated");
  }

  if (plan.isLoading) return <Loading />;
  if (plan.error) return <ErrorState error={plan.error} onRetry={() => plan.refetch()} />;
  const recs = plan.data?.crop_recommendations ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Crop Recommendations" subtitle={plan.data ? `${plan.data.communities?.name ?? "Community"} · ${plan.data.farming_technique} · ${plan.data.community_skill_level}` : undefined} back />
      {!recs.length ? (
        <Empty title="No crop plans yet." text="Start your first community plan." action={<Button asChild><Link to="/planner">Open planner</Link></Button>} />
      ) : (
        <>
          <div className="flex gap-2">
            <Button onClick={() => acceptAll(recs)} className="flex-1" disabled={!!busy || recs.every((r) => r.status === "accepted")}><CheckCheck className="mr-1 h-4 w-4" />Accept all</Button>
            <Button asChild variant="secondary" className="flex-1"><Link to="/schedule"><CalendarDays className="mr-1 h-4 w-4" />View Schedule</Link></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recs.map((r) => {
              const name = r.crops?.crop_name ?? "Crop";
              const m = CROP_META[name];
              const accepted = r.status === "accepted";
              return (
                <div key={r.id} className={`card-surface p-5 ${accepted ? "ring-2 ring-fresh/40" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Sprout className="h-6 w-6" /></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold">{name}</h3>
                        {accepted && <span className="flex items-center gap-1 text-xs font-semibold text-fresh"><Check className="h-3.5 w-3.5" />Accepted</span>}
                      </div>
                      <SuitabilityBadge level={r.suitability} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Recommended" value={`${r.recommended_quantity}`} sub="plants" />
                    <Metric label="Harvest" value={m ? `${m.minDays}–${m.maxDays}` : `${r.estimated_harvest_days}`} sub="days" />
                    <Metric label="Est. yield" value={`${expectedKg(name, r.recommended_quantity ?? 0)}`} sub="kg" />
                  </div>
                  <p className="mt-3 text-sm"><span className="font-semibold">Why: </span><span className="text-muted-foreground">{r.reason}</span></p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button size="sm" onClick={async () => { await accept(r); await qc.invalidateQueries(); toast.success(`${name} accepted & scheduled`); }} disabled={accepted || busy === r.id}>
                      <Check className="mr-1 h-4 w-4" />{accepted ? "Done" : "Accept"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setAdjust(r); setQty(String(r.recommended_quantity ?? 1)); }}><SlidersHorizontal className="mr-1 h-4 w-4" />Adjust</Button>
                    <Button size="sm" variant="secondary" asChild><Link to="/schedule"><Clock className="mr-1 h-4 w-4" />Schedule</Link></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust {adjust?.crops?.crop_name}</DialogTitle></DialogHeader>
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="h-11" />
          <DialogFooter><Button onClick={saveAdjust}>Save quantity</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-muted p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-display text-base font-semibold">{value} <span className="text-xs font-normal text-muted-foreground">{sub}</span></div>
    </div>
  );
}
