import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Sprout, Wheat, Scale, CalendarDays, ClipboardPlus, ShieldCheck, MessageCircle, Crown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, Empty, ErrorState, Loading, PageHeader, StatCard, communityImage } from "@/components/kebun";
import { useHarvests, useLatestPlan, useMemberCount, usePublicProfiles, useUser, fmtDate, sumKg } from "@/lib/data";
import { expectedKg } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/communities/$id")({
  head: () => ({ meta: [{ title: "Community Dashboard — KebunKite" }, { name: "description", content: "Your community's crop plan, harvests and food security impact." }] }),
  component: CommunityDashboard,
});

function CommunityDashboard() {
  const { id } = Route.useParams();
  const community = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const user = useUser();
  const members = useMemberCount(id);
  const adminQ = usePublicProfiles([community.data?.admin_id]);
  const plan = useLatestPlan(id);
  const harvests = useHarvests(id);

  if (community.isLoading) return <Loading />;
  if (community.error) return <ErrorState error={community.error} onRetry={() => community.refetch()} />;
  if (!community.data) return <Empty title="Community not found" action={<Button asChild><Link to="/communities">Browse communities</Link></Button>} />;

  const c = community.data;
  const isAdmin = !!c.admin_id && c.admin_id === user.id;
  const admin = c.admin_id ? adminQ.data?.get(c.admin_id) : undefined;
  const recs = plan.data?.crop_recommendations ?? [];
  const expected = Math.round(recs.reduce((s, r) => s + expectedKg(r.crops?.crop_name ?? "", r.recommended_quantity ?? 0), 0) * 10) / 10;
  const totals = sumKg(harvests.data);
  const pct = expected ? Math.min(100, Math.round((totals.output / expected) * 100)) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title={c.name} back />
      <div className="relative -mt-2 overflow-hidden rounded-2xl">
        <img src={c.image_url || communityImage(c.name)} alt={c.name} width={1024} height={640} className="h-44 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-forest/80 p-4 text-on-forest">
          <p className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" />{c.location}</p>
          <p className="mt-0.5 text-xs opacity-85">{c.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {isAdmin
          ? <Button asChild className="h-auto flex-col gap-1 py-3 text-center whitespace-normal"><Link to="/planner"><Sprout className="h-5 w-5" />Generate Community Plan</Link></Button>
          : <Button asChild className="h-auto flex-col gap-1 py-3 text-center whitespace-normal"><Link to="/recommendations"><Sprout className="h-5 w-5" />View Community Plan</Link></Button>}
        <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3"><Link to="/schedule"><CalendarDays className="h-5 w-5" />View Schedule</Link></Button>
        <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3"><Link to="/harvest"><ClipboardPlus className="h-5 w-5" />Record Harvest</Link></Button>
      </div>

      <Link to="/communities/$id/chat" params={{ id }} className="card-surface flex items-center gap-3 p-4 hover:ring-2 hover:ring-fresh/30">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><MessageCircle className="h-5 w-5" /></span>
        <div className="flex-1"><p className="font-semibold">Community Chat</p><p className="text-xs text-muted-foreground">Talk with your neighbours in {c.name}</p></div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      <div className="card-surface flex items-center gap-3 p-4">
        <Avatar name={admin?.full_name} photo={admin?.profile_photo} size="lg" />
        <div className="flex-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Crown className="h-3.5 w-3.5 text-sun" />Community Admin</p>
          <p className="font-semibold">{c.admin_id ? (admin?.full_name || "Community member") : "No admin yet"}</p>
          {isAdmin && <p className="text-xs text-fresh">You are the community administrator.</p>}
        </div>
        {c.admin_id && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">Community Admin</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Members" value={members.data ?? "…"} icon={Users} />
        <StatCard label="Crops in plan" value={recs.length} icon={Sprout} />
        <StatCard label="Expected Harvest" value={expected} unit="kg" icon={Wheat} />
        <StatCard label="Food Output" value={totals.output} unit="kg" icon={Scale} />
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-fresh" /><h3 className="font-semibold">Community food security summary</h3></div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Ring label="Plan → harvest" pct={pct} />
          <div className="rounded-xl bg-secondary p-3"><div className="font-display text-xl font-semibold text-primary">{totals.output}kg</div><div className="text-[11px] text-muted-foreground">Produced</div></div>
          <div className="rounded-xl bg-sun/20 p-3"><div className="font-display text-xl font-semibold">{totals.surplus}kg</div><div className="text-[11px] text-muted-foreground">Surplus to share</div></div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 font-semibold">Current crop plan</h3>
        {plan.isLoading ? <Loading /> : !recs.length ? (
          <Empty title="No crop plans yet." text={isAdmin ? "Start your first community plan." : "Only the community administrator can generate the community crop plan."} action={isAdmin ? <Button asChild size="sm"><Link to="/planner">Generate Community Plan</Link></Button> : undefined} />
        ) : (
          <div className="card-surface divide-y">
            {recs.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium">{r.crops?.crop_name}</span>
                <span className="text-muted-foreground">{r.recommended_quantity} plants · {r.estimated_harvest_days}d</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "accepted" ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent harvest</h3><Link to="/harvest" className="text-sm font-medium text-fresh">See all</Link></div>
        {harvests.isLoading ? <Loading /> : !harvests.data?.length ? (
          <Empty icon={Wheat} title="Your community has no harvest records yet." />
        ) : (
          <div className="card-surface divide-y">
            {harvests.data.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium">{h.crops?.crop_name}</span>
                <span className="text-muted-foreground">{fmtDate(h.harvest_date)}</span>
                <span className="font-semibold">{Number(h.quantity_kg)} kg</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Ring({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-muted p-2">
      <div className="relative grid h-14 w-14 place-items-center rounded-full" style={{ background: `conic-gradient(var(--fresh) ${pct * 3.6}deg, var(--border) 0)` }}>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-card text-xs font-bold">{pct}%</div>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
