import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Scale, Gift, Wheat, Sprout, HandHeart, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, ErrorState, Loading, PageHeader, StatCard } from "@/components/kebun";
import { useCrops, useCurrentCommunity, useHarvests, useMemberships, useUser, fmtDate, sumKg } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/harvest")({
  head: () => ({ meta: [{ title: "Crop Output & History — KebunKite" }, { name: "description", content: "Record harvests, track food output and share surplus." }, { property: "og:title", content: "Crop Output & History — KebunKite" }, { property: "og:description", content: "Record harvests, track food output and share surplus." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ] }),
  component: Harvest,
});

function Harvest() {
  const user = useUser();
  const qc = useQueryClient();
  const { community, isLoading: cl } = useCurrentCommunity();
  const memberships = useMemberships();
  const crops = useCrops();
  const harvests = useHarvests(community?.id);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ community_id: "", crop_id: "", harvest_date: new Date().toISOString().slice(0, 10), quantity_kg: "", surplus_kg: "" });

  useEffect(() => {
    if (community && !f.community_id) setF((s) => ({ ...s, community_id: community.id }));
  }, [community, f.community_id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const q = Number(f.quantity_kg), s = Number(f.surplus_kg || 0);
    if (!f.crop_id || !(q > 0)) return void toast.error("Choose a crop and enter quantity.");
    if (s > q) return void toast.error("Surplus can't exceed quantity.");
    setBusy(true);
    const { error } = await supabase.from("harvest_outputs").insert({
      community_id: f.community_id || null, household_id: user.id, crop_id: f.crop_id, harvest_date: f.harvest_date, quantity_kg: q, surplus_kg: s,
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    await qc.invalidateQueries();
    setOpen(false);
    setF((x) => ({ ...x, crop_id: "", quantity_kg: "", surplus_kg: "" }));
    toast.success("Harvest recorded — dashboard updated");
  }

  async function share(id: string) {
    const { error } = await supabase.from("harvest_outputs").update({ shared_at: new Date().toISOString() }).eq("id", id);
    if (error) return void toast.error(error.message);
    await qc.invalidateQueries();
    toast.success("Shared with community members");
  }

  if (cl) return <Loading />;
  const rows = harvests.data ?? [];
  const t = sumKg(rows);
  const surplus = rows.filter((r) => Number(r.surplus_kg) > 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Crop Output & History" subtitle={community ? community.name : "Your household"} back
        action={<Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Record Harvest</Button>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Food Output" value={t.output} unit="kg" icon={Scale} />
        <StatCard label="Total Surplus" value={t.surplus} unit="kg" icon={Gift} />
        <StatCard label="Harvests" value={rows.length} icon={Wheat} />
        <StatCard label="Crops Grown" value={new Set(rows.map((r) => r.crop_id)).size} icon={Sprout} />
      </div>

      <section>
        <h3 className="mb-3 font-semibold">History</h3>
        {harvests.isLoading ? <Loading /> : harvests.error ? <ErrorState error={harvests.error} onRetry={() => harvests.refetch()} /> : !rows.length ? (
          <Empty icon={Wheat} title="Your community has no harvest records yet." text="Record your first harvest to measure impact." action={<Button onClick={() => setOpen(true)}>Record Harvest</Button>} />
        ) : (
          <div className="card-surface overflow-hidden">
            <div className="grid grid-cols-4 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span>Crop</span><span>Date</span><span className="text-right">Qty</span><span className="text-right">Surplus</span>
            </div>
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-4 px-4 py-3 text-sm">
                  <span className="font-medium">{r.crops?.crop_name}</span>
                  <span className="text-muted-foreground">{fmtDate(r.harvest_date)}</span>
                  <span className="text-right">{Number(r.quantity_kg)} kg</span>
                  <span className="text-right text-fresh">{Number(r.surplus_kg)} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><HandHeart className="h-5 w-5 text-harvest" /><h3 className="font-semibold">Community Harvest Exchange</h3></div>
        {!surplus.length ? (
          <Empty icon={Gift} title="No surplus to share yet" text="Record a harvest with surplus to offer it to neighbours." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {surplus.map((r) => (
              <div key={r.id} className="card-surface p-4">
                <p className="font-semibold">{r.crops?.crop_name}</p>
                <p className="font-display text-2xl font-semibold text-harvest">{Number(r.surplus_kg)} kg</p>
                <p className="text-xs text-muted-foreground">surplus · available for community members</p>
                {r.shared_at ? (
                  <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-fresh"><Check className="h-3.5 w-3.5" />Shared</p>
                ) : r.household_id === user.id ? (
                  <Button size="sm" className="mt-3 w-full" variant="secondary" onClick={() => share(r.id)}>Share Harvest</Button>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Offered by a neighbour</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {!community && <p className="text-center text-sm text-muted-foreground"><Link to="/communities" className="font-medium text-fresh">Join a community</Link> to pool harvests with neighbours.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Harvest</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Community</Label>
              <select className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm" value={f.community_id} onChange={(e) => setF({ ...f, community_id: e.target.value })}>
                <option value="">Household only</option>
                {(memberships.data ?? []).map((m) => <option key={m.community_id} value={m.community_id}>{m.communities?.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Crop</Label>
              <select required className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm" value={f.crop_id} onChange={(e) => setF({ ...f, crop_id: e.target.value })}>
                <option value="">Select crop</option>
                {(crops.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.crop_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label>Harvest Date</Label><Input type="date" className="h-11" value={f.harvest_date} onChange={(e) => setF({ ...f, harvest_date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Quantity (kg)</Label><Input type="number" step="0.1" min="0" className="h-11" value={f.quantity_kg} onChange={(e) => setF({ ...f, quantity_kg: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Surplus (kg)</Label><Input type="number" step="0.1" min="0" className="h-11" value={f.surplus_kg} onChange={(e) => setF({ ...f, surplus_kg: e.target.value })} /></div>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Saving…" : "Save harvest"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
