import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Sprout, Wheat, Scale, Leaf, HeartPulse, MessageCircle, ClipboardPlus, ArrowRight, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading, StatCard, Empty } from "@/components/kebun";
import { useCurrentCommunity, useHarvests, useLatestPlan, useMemberCount, useProfile, useSchedule, greeting, sumKg, fmtDate } from "@/lib/data";
import { expectedKg } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — KebunKite" }, { name: "description", content: "Your community food security dashboard." }] }),
  component: Home,
});

function Home() {
  const profile = useProfile();
  const { community, isLoading: cLoading } = useCurrentCommunity();
  const members = useMemberCount(community?.id);
  const plan = useLatestPlan(community?.id);
  const harvests = useHarvests(community?.id);
  const schedule = useSchedule();

  if (profile.isLoading || cLoading) return <Loading />;

  const recs = plan.data?.crop_recommendations ?? [];
  const expected = Math.round(recs.reduce((s, r) => s + expectedKg(r.crops?.crop_name ?? "", r.recommended_quantity ?? 0), 0) * 10) / 10;
  const totals = sumKg(harvests.data);
  const shared = Math.round((harvests.data ?? []).filter((h) => h.shared_at).reduce((s, h) => s + Number(h.surplus_kg), 0) * 10) / 10;
  const firstName = profile.data?.full_name?.split(" ")[0] ?? "there";
  const progress = expected > 0 ? Math.min(100, Math.round((totals.output / expected) * 100)) : 0;

  const activity = [
    ...(harvests.data ?? []).slice(0, 3).map((h) => ({ key: h.id, when: h.created_at, text: `Harvested ${Number(h.quantity_kg)} kg of ${h.crops?.crop_name}`, icon: Wheat })),
    ...(schedule.data ?? []).filter((s) => s.status === "Completed").slice(-3).map((s) => ({ key: s.id, when: s.created_at, text: `${s.activity} completed for ${s.crops?.crop_name}`, icon: Activity })),
    ...(plan.data ? [{ key: plan.data.id, when: plan.data.created_at, text: `Community plan created with ${recs.length} crops`, icon: Sprout }] : []),
  ].sort((a, b) => (b.when > a.when ? 1 : -1)).slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{greeting()}, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Let's grow a healthier community together.</p>
        {community ? (
          <Link to="/communities/$id" params={{ id: community.id }} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5" /> {community.name}
          </Link>
        ) : (
          <Link to="/communities" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1.5 text-xs font-semibold text-sun-foreground">
            <Users className="h-3.5 w-3.5" /> Join a community to get started
          </Link>
        )}
      </div>

      {!profile.data?.farming_technique && (
        <div className="card-surface flex items-center justify-between gap-3 p-4">
          <p className="text-sm">Finish your household profile for better plans.</p>
          <Button asChild size="sm" variant="outline"><Link to="/setup">Complete</Link></Button>
        </div>
      )}

      <div className="hero-forest relative overflow-hidden rounded-2xl p-6">
        <Leaf className="absolute -right-6 -bottom-6 h-36 w-36 opacity-10" />
        <p className="text-xs font-semibold tracking-widest text-sun uppercase">Community Kebun Planner</p>
        <h2 className="mt-2 text-xl font-semibold">Plan what your community needs to grow.</h2>
        <p className="mt-1 text-sm opacity-85">Household needs + growing capacity → a practical crop plan.</p>
        <Button asChild className="mt-4 bg-sun text-sun-foreground hover:bg-sun/90" size="lg">
          <Link to="/planner">Start Planning <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Households" value={members.data ?? (community ? "…" : 1)} icon={Users} />
        <StatCard label="Crops Planned" value={recs.length} icon={Sprout} />
        <StatCard label="Expected Harvest" value={expected} unit="kg" icon={Wheat} />
        <StatCard label="Food Output" value={totals.output} unit="kg" icon={Scale} />
      </div>

      <div className="card-surface p-5">
        <h3 className="font-semibold">Community Impact</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your community is growing towards greater food resilience.</p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-fresh transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{progress}% of expected harvest produced</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Impact label="Crops planned" value={recs.reduce((s, r) => s + (r.recommended_quantity ?? 0), 0)} unit="plants" />
          <Impact label="Expected" value={expected} unit="kg" />
          <Impact label="Surplus shared" value={shared} unit="kg" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Quick actions</h3>
        <div className="grid grid-cols-4 gap-2">
          <Quick to="/planner" icon={Sprout} label="Plan Crops" />
          <Quick to="/health" icon={HeartPulse} label="Plant Health" />
          <Quick to="/advisor" icon={MessageCircle} label="Advisor" />
          <Quick to="/harvest" icon={ClipboardPlus} label="Record Harvest" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Recent activity</h3>
        {activity.length === 0 ? (
          <Empty title="No activity yet" text="Start your first community plan." action={<Button asChild size="sm"><Link to="/planner">Start planning</Link></Button>} />
        ) : (
          <div className="card-surface divide-y">
            {activity.map((a) => (
              <div key={a.key} className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><a.icon className="h-4 w-4" /></span>
                <p className="flex-1 text-sm">{a.text}</p>
                <span className="text-xs text-muted-foreground">{fmtDate(a.when)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Impact({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="font-display text-lg font-semibold text-primary">{value}<span className="ml-0.5 text-xs font-medium">{unit}</span></div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Quick({ to, icon: Icon, label }: { to: "/planner" | "/health" | "/advisor" | "/harvest"; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="card-surface flex flex-col items-center gap-2 px-1 py-3 text-center text-xs font-medium hover:border-fresh">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
      {label}
    </Link>
  );
}
