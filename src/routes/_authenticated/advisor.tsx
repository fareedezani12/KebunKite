import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/kebun";
import { useNeeds, useProfile } from "@/lib/data";
import { answer, SUGGESTED } from "@/lib/advice";

export const Route = createFileRoute("/_authenticated/advisor")({
  head: () => ({ meta: [{ title: "Farming Advisor — KebunKite" }, { name: "description", content: "Ask the KebunKite farming assistant for growing guidance." }] }),
  component: Advisor,
});

type Msg = { role: "user" | "bot"; text: string };

function Advisor() {
  const profile = useProfile();
  const needs = useNeeds();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  function ask(q: string) {
    if (!q.trim() || typing) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const text = answer(q, { technique: profile.data?.farming_technique, skill: profile.data?.skill_level, crops: (needs.data ?? []).map((n) => n.crop_name) });
      setMsgs((m) => [...m, { role: "bot", text }]);
      setTyping(false);
    }, 700);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <PageHeader title="Farming Advisor" subtitle="Your AI-assisted growing companion." />
      <div className="space-y-3">
        <Bubble role="bot" text={`Hi${profile.data?.full_name ? " " + profile.data.full_name.split(" ")[0] : ""}! I tailor advice to your ${profile.data?.farming_technique ?? "garden"} setup and ${profile.data?.skill_level?.toLowerCase() ?? "beginner"} experience. What would you like to know?`} />
        {msgs.map((m, i) => <Bubble key={i} {...m} />)}
        {typing && <div className="w-16 rounded-2xl bg-card p-3 text-center text-muted-foreground shadow-sm">•••</div>}
        <div ref={end} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full border bg-card px-3 py-1.5 text-sm text-primary hover:border-fresh">{s}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-24 mt-4 flex gap-2 md:bottom-4">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your crops…" className="h-12 bg-card" />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0" aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

function Bubble({ role, text }: Msg) {
  const html = text.split("\n").map((line, i) => (
    <p key={i} className={line ? "" : "h-2"}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => part.startsWith("**") ? <b key={j}>{part.slice(2, -2)}</b> : part)}
    </p>
  ));
  if (role === "user") return <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">{html}</div>;
  return (
    <div className="flex max-w-[90%] gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Leaf className="h-4 w-4" /></span>
      <div className="card-surface rounded-tl-sm px-4 py-3 text-sm">
        <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-fresh"><Sparkles className="h-3 w-3" />KebunKite Advisor</div>
        {html}
      </div>
    </div>
  );
}
