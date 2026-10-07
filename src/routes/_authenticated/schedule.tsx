import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Circle, Loader, Shovel, Sprout, Droplets, Eye, Wheat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/kebun";
import { useSchedule, fmtDate } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({ meta: [{ title: "Planting & Harvest Schedule — KebunKite" }, { name: "description", content: "Track planting, watering, monitoring and harvest activities." }, { property: "og:title", content: "Planting & Harvest Schedule — KebunKite" }, { property: "og:description", content: "Track planting, watering, monitoring and harvest activities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ] }),
  component: Schedule,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { Prepare: Shovel, Plant: Sprout, Water: Droplets, Monitor: Eye, Harvest: Wheat };
const NEXT: Record<string, string> = { Scheduled: "In Progress", "In Progress": "Completed", Completed: "Scheduled" };

function Schedule() {
  const qc = useQueryClient();
  const schedule = useSchedule();

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("planting_schedule").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["schedule"] });
  }

  if (schedule.isLoading) return <Loading />;
  if (schedule.error) return <ErrorState error={schedule.error} onRetry={() => schedule.refetch()} />;

  const groups = new Map<string, NonNullable<typeof schedule.data>>();
  for (const s of schedule.data ?? []) {
    const k = s.recommendation_id ?? s.id;
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Planting & Harvest Schedule" subtitle="Tap an activity's status to move it forward." back
        action={<Button asChild size="sm" variant="secondary"><Link to="/harvest">Record harvest</Link></Button>} />
      {groups.size === 0 ? (
        <Empty icon={CalendarDays} title="No activities scheduled" text="Accept crop recommendations to build your schedule." action={<Button asChild><Link to="/recommendations">View recommendations</Link></Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...groups.values()].map((items) => {
            const first = items[0]!;
            const done = items.filter((i) => i.status === "Completed").length;
            return (
              <div key={first.recommendation_id ?? first.id} className="card-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{first.crops?.crop_name}</h3>
                    <p className="text-sm text-muted-foreground">{first.quantity} plants · Harvest {fmtDate(first.expected_harvest_date)}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{done}/{items.length}</span>
                </div>
                <ol className="mt-4 space-y-0">
                  {items.map((i, idx) => {
                    const Icon = ICONS[i.activity ?? ""] ?? Circle;
                    return (
                      <li key={i.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {idx < items.length - 1 && <span className="absolute top-9 left-[17px] h-[calc(100%-2rem)] w-px bg-border" />}
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${i.status === "Completed" ? "bg-fresh text-on-forest" : "bg-secondary text-primary"}`}>
                          {i.status === "Completed" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </span>
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <div>
                            <p className={`text-sm font-medium ${i.status === "Completed" ? "text-muted-foreground line-through" : ""}`}>{i.activity}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(i.planting_date)}</p>
                          </div>
                          <button onClick={() => setStatus(i.id, NEXT[i.status] ?? "Scheduled")} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            i.status === "Completed" ? "bg-secondary text-primary" : i.status === "In Progress" ? "bg-sun/25 text-sun-foreground" : "bg-muted text-muted-foreground"}`}>
                            {i.status === "In Progress" && <Loader className="h-3 w-3" />}
                            {i.status}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
