import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Pencil, Mail, MapPin, Users, Sprout, Ruler, GraduationCap, Wheat, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, PageHeader } from "@/components/kebun";
import { useNeeds, useProfile, useUser } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — KebunKite" }, { name: "description", content: "Your KebunKite household profile." }, { property: "og:title", content: "Profile — KebunKite" }, { property: "og:description", content: "Your KebunKite household profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ] }),
  component: Profile,
});

function Profile() {
  const user = useUser();
  const navigate = useNavigate();
  const profile = useProfile();
  const needs = useNeeds();

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (profile.isLoading) return <Loading />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  const p = profile.data;
  const initials = (p?.full_name ?? user.email ?? "K").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const rows = [
    { icon: Mail, label: "Email", value: p?.email ?? user.email },
    { icon: MapPin, label: "Location", value: p?.location },
    { icon: Users, label: "Household Members", value: p?.household_members },
    { icon: Sprout, label: "Farming Technique", value: p?.farming_technique },
    { icon: Ruler, label: "Growing Area", value: p?.growing_area != null ? `${p.growing_area} m²` : null },
    { icon: GraduationCap, label: "Skill Level", value: p?.skill_level },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Profile" />
      <div className="hero-forest flex items-center gap-4 rounded-2xl p-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-sun font-display text-xl font-semibold text-sun-foreground">{initials}</span>
        <div>
          <h2 className="text-xl font-semibold">{p?.full_name ?? "Grower"}</h2>
          <p className="text-sm opacity-85">KebunKite community grower</p>
        </div>
      </div>

      <div className="card-surface divide-y">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 p-4">
            <r.icon className="h-4 w-4 text-fresh" />
            <span className="flex-1 text-sm text-muted-foreground">{r.label}</span>
            <span className="text-sm font-medium">{r.value ?? "—"}</span>
          </div>
        ))}
      </div>

      {!!needs.data?.length && (
        <div className="card-surface p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wheat className="h-4 w-4 text-fresh" />Household food needs</p>
          <div className="flex flex-wrap gap-2">
            {needs.data.map((n) => <span key={n.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">{n.crop_name} · {n.quantity_needed}</span>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="secondary"><Link to="/harvest"><Wheat className="mr-1 h-4 w-4" />Harvests</Link></Button>
        <Button asChild variant="secondary"><Link to="/health"><HeartPulse className="mr-1 h-4 w-4" />Plant Health</Link></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild size="lg"><Link to="/setup"><Pencil className="mr-1 h-4 w-4" />Edit Profile</Link></Button>
        <Button size="lg" variant="outline" onClick={logout}><LogOut className="mr-1 h-4 w-4" />Logout</Button>
      </div>
    </div>
  );
}
