import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Users, Sprout, MessageCircle, User, Loader2, AlertCircle, ChevronLeft, Leaf } from "lucide-react";
import garden from "@/assets/garden.jpg";
import rooftop from "@/assets/rooftop.jpg";
import kampung from "@/assets/kampung.jpg";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/communities", label: "Community", icon: Users },
  { to: "/planner", label: "Planner", icon: Sprout },
  { to: "/advisor", label: "Advisor", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${light ? "bg-on-forest/15 text-on-forest" : "bg-primary text-primary-foreground"}`}>
        <Leaf className="h-4 w-4" />
      </span>
      <span className={`font-display text-lg font-semibold ${light ? "text-on-forest" : "text-primary"}`}>KebunKite</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/home"><Logo /></Link>
          <nav className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-5 pb-safe-nav md:pb-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        {back && (
          <button onClick={() => history.length > 1 ? history.back() : navigate({ to: "/home" })} className="mb-2 -ml-1 flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, unit, icon: Icon }: { label: string; value: ReactNode; unit?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 text-fresh" />}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-foreground">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-muted-foreground">Something went wrong. {error instanceof Error ? error.message : ""}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Empty({ icon: Icon = Sprout, title, text, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center gap-2 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-6 w-6" /></span>
      <p className="font-display font-semibold">{title}</p>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function communityImage(name?: string | null) {
  if (!name) return garden;
  if (name.includes("Hijau")) return rooftop;
  if (name.includes("Kampung")) return kampung;
  return garden;
}

export function SuitabilityBadge({ level }: { level?: string | null }) {
  const cls =
    level === "High" ? "bg-secondary text-primary" : level === "Medium" ? "bg-sun/25 text-sun-foreground" : "bg-harvest/20 text-foreground";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{level ?? "—"} suitability</span>;
}
