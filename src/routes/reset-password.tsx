import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/kebun";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — KebunKite" },
      { name: "description", content: "Choose a new password for your KebunKite account." },
      { property: "og:title", content: "Reset password — KebunKite" },
      { property: "og:description", content: "Choose a new password for your KebunKite account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/home" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="card-surface w-full max-w-md space-y-4 p-6">
        <Logo />
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" />
        </div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
