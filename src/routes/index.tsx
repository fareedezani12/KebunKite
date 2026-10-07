import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/kebun";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KebunKite — Growing Communities, Securing Food" },
      { name: "description", content: "Plan, grow and share food as a community with KebunKite's community kebun planner." },
      { property: "og:title", content: "KebunKite — Growing Communities, Securing Food" },
      { property: "og:description", content: "From managing individual plants to planning community food security." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/home" : "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <div className="hero-forest flex min-h-screen flex-col items-center justify-center gap-3">
      <Logo light />
      <p className="text-sm opacity-80">Growing Communities, Securing Food.</p>
    </div>
  );
}
