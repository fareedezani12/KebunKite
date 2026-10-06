import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, ErrorState, Loading, PageHeader, communityImage } from "@/components/kebun";
import { useCommunities, useMemberships, useUser } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/communities/")({
  head: () => ({ meta: [{ title: "Discover Communities — KebunKite" }, { name: "description", content: "Find and join neighbourhood growing communities." }] }),
  component: Discover,
});

function Discover() {
  const user = useUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const communities = useCommunities();
  const memberships = useMemberships();
  const [joining, setJoining] = useState<string | null>(null);
  const mine = new Set((memberships.data ?? []).map((m) => m.community_id));

  async function join(id: string) {
    if (mine.has(id)) return navigate({ to: "/communities/$id", params: { id } });
    setJoining(id);
    const { error } = await supabase.from("community_members").insert({ community_id: id, user_id: user.id, role: "member" });
    setJoining(null);
    if (error && error.code !== "23505") return toast.error(error.message);
    await qc.invalidateQueries();
    toast.success("You joined the community!");
    navigate({ to: "/communities/$id", params: { id } });
  }

  return (
    <div>
      <PageHeader title="Discover Communities" subtitle="Join neighbours growing food together." />
      {communities.isLoading ? <Loading /> : communities.error ? <ErrorState error={communities.error} onRetry={() => communities.refetch()} /> : !communities.data?.length ? (
        <Empty icon={Users} title="No communities yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {communities.data.map((c) => (
            <div key={c.id} className="card-surface overflow-hidden">
              <img src={c.image_url || communityImage(c.name)} alt={c.name} loading="lazy" width={1024} height={640} className="h-36 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  {mine.has(c.id) && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">Member</span>}
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.location}</p>
                <p className="text-sm">{c.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" />{c.memberCount} members</span>
                  <Button onClick={() => join(c.id)} disabled={joining === c.id} variant={mine.has(c.id) ? "outline" : "default"}>
                    {joining === c.id ? "Joining…" : mine.has(c.id) ? "Open" : "Join"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
