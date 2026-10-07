import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/kebun";
import garden from "@/assets/garden.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign up or log in — KebunKite" },
      { name: "description", content: "Join KebunKite to plan and grow food with your community." },
      { property: "og:title", content: "Join KebunKite" },
      { property: "og:description", content: "Growing Communities, Securing Food." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signup" | "login" | "forgot">("signup");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        if (f.password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (f.password !== f.confirm) throw new Error("Passwords do not match.");
        const { data, error } = await supabase.auth.signUp({
          email: f.email.trim(),
          password: f.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: f.name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          setTab("login");
          return;
        }
        await supabase.from("profiles").upsert({ id: data.user!.id, full_name: f.name.trim(), email: f.email.trim() });
        toast.success("Welcome to KebunKite!");
        navigate({ to: "/setup" });
      } else if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) throw error;
        navigate({ to: "/home" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setTab("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src={garden} alt="Neighbours tending a community vegetable garden" className="absolute inset-0 h-full w-full object-cover" width={1280} height={832} />
        <div className="absolute inset-0 bg-forest/55" />
        <div className="relative flex h-full flex-col justify-end p-10 text-on-forest">
          <h2 className="text-3xl font-semibold">From managing individual plants to planning community food security.</h2>
          <p className="mt-3 opacity-90">Grow what communities need. Grow it better. Make every harvest count.</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="hero-forest relative overflow-hidden px-6 pt-10 pb-14 md:hidden">
          <Logo light />
          <h1 className="mt-6 text-2xl font-semibold">Growing Communities, Securing Food.</h1>
          <p className="mt-2 text-sm opacity-85">Plan what your community needs to grow — together.</p>
        </div>

        <div className="-mt-6 flex flex-1 items-start justify-center px-4 pb-10 md:mt-0 md:items-center">
          <div className="card-surface w-full max-w-md p-6">
            <div className="hidden md:mb-6 md:block"><Logo /></div>
            {tab !== "forgot" ? (
              <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1">
                {(["signup", "login"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-lg py-2 text-sm font-semibold transition ${tab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
                  >
                    {t === "signup" ? "Sign Up" : "Log In"}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Reset password</h2>
                <p className="text-sm text-muted-foreground">We'll email you a reset link.</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {tab === "signup" && (
                <Field label="Full Name"><Input required value={f.name} onChange={set("name")} placeholder="Aisyah Rahman" className="h-11" /></Field>
              )}
              <Field label="Email"><Input required type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" className="h-11" /></Field>
              {tab !== "forgot" && (
                <Field label="Password"><Input required type="password" value={f.password} onChange={set("password")} className="h-11" /></Field>
              )}
              {tab === "signup" && (
                <Field label="Confirm Password"><Input required type="password" value={f.confirm} onChange={set("confirm")} className="h-11" /></Field>
              )}
              {tab === "login" && (
                <button type="button" onClick={() => setTab("forgot")} className="text-sm font-medium text-fresh hover:underline">Forgot Password?</button>
              )}
              <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy}>
                {busy ? "Please wait…" : tab === "signup" ? "Create Account" : tab === "login" ? "Log In" : "Send reset link"}
              </Button>
              {tab === "forgot" && (
                <button type="button" onClick={() => setTab("login")} className="w-full text-sm text-muted-foreground">Back to log in</button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
