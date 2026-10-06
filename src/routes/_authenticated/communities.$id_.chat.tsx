import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Empty, ErrorState, Loading, PageHeader } from "@/components/kebun";
import { useMemberCount, useMemberships, usePublicProfiles, useUser } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/communities/$id_/chat")({
  head: () => ({ meta: [{ title: "Community Chat — KebunKite" }, { name: "description", content: "Chat with your neighbours in your growing community." }] }),
  component: CommunityChat,
});

function fmtTime(d: string) {
  const date = new Date(d);
  const today = new Date().toDateString() === date.toDateString();
  return date.toLocaleString("en-MY", today ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function CommunityChat() {
  const { id } = Route.useParams();
  const user = useUser();
  const qc = useQueryClient();
  const memberships = useMemberships();
  const members = useMemberCount(id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const community = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const isMember = (memberships.data ?? []).some((m) => m.community_id === id);

  const messages = useQuery({
    queryKey: ["messages", id],
    enabled: isMember,
    refetchInterval: 15000, // fallback if realtime drops
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_messages")
        .select("*")
        .eq("community_id", id)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data;
    },
  });
  const profiles = usePublicProfiles((messages.data ?? []).map((m) => m.user_id));

  useEffect(() => {
    if (!isMember) return;
    const channel = supabase
      .channel(`community-chat-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["messages", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, isMember, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    const { error } = await supabase.from("community_messages").insert({ community_id: id, user_id: user.id, message: msg });
    setSending(false);
    if (error) return void toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", id] });
  }

  if (community.isLoading || memberships.isLoading) return <Loading />;
  if (community.error) return <ErrorState error={community.error} onRetry={() => community.refetch()} />;
  if (!community.data) return <Empty title="Community not found" />;
  if (!isMember) {
    return (
      <div>
        <PageHeader title={community.data.name} back />
        <Empty icon={MessageCircle} title="Join this community to chat" text="Only members can read and send messages." action={<Button asChild><Link to="/communities">Discover communities</Link></Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col">
      <PageHeader
        title={community.data.name}
        subtitle="Community Chat"
        back
        action={<span className="mt-8 flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary"><Users className="h-3.5 w-3.5" />{members.data ?? "…"} members</span>}
      />

      <div className="flex-1 space-y-3 pb-4">
        {messages.isLoading ? <Loading /> : messages.error ? <ErrorState error={messages.error} onRetry={() => messages.refetch()} /> : !messages.data?.length ? (
          <Empty icon={MessageCircle} title="No messages yet" text="Say hello to your neighbours!" />
        ) : (
          messages.data.map((m) => {
            const mine = m.user_id === user.id;
            const p = profiles.data?.get(m.user_id);
            const name = mine ? "You" : p?.full_name || "Member";
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar name={p?.full_name} photo={p?.profile_photo} size="sm" />
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card shadow-sm"}`}>
                  <div className={`text-[11px] font-semibold ${mine ? "opacity-85" : "text-primary"}`}>{name}</div>
                  <p className="whitespace-pre-wrap break-words text-sm">{m.message}</p>
                  <div className={`mt-0.5 text-right text-[10px] ${mine ? "opacity-75" : "text-muted-foreground"}`}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-[4.75rem] flex gap-2 rounded-2xl border bg-card p-2 shadow-sm md:bottom-4">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." maxLength={2000} className="h-11 flex-1 border-0 shadow-none focus-visible:ring-0" aria-label="Message" />
        <Button type="submit" size="icon" className="h-11 w-11" disabled={sending || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
