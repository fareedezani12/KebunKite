import { Minus, Plus, Check } from "lucide-react";
import { CROP_NAMES } from "@/lib/planner";

export function NeedsPicker({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const toggle = (c: string) => {
    const next = { ...value };
    if (next[c]) delete next[c];
    else next[c] = 4;
    onChange(next);
  };
  const step = (c: string, d: number) => onChange({ ...value, [c]: Math.max(1, (value[c] ?? 1) + d) });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CROP_NAMES.map((c) => {
          const on = !!value[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:border-fresh"}`}
            >
              {on && <Check className="h-3.5 w-3.5" />}
              {c}
            </button>
          );
        })}
      </div>
      {Object.keys(value).length > 0 && (
        <div className="divide-y rounded-xl border bg-card">
          {Object.entries(value).map(([c, q]) => (
            <div key={c} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-medium">{c}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => step(c, -1)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary" aria-label={`Less ${c}`}><Minus className="h-4 w-4" /></button>
                <span className="w-16 text-center text-sm"><b>{q}</b> plants</span>
                <button type="button" onClick={() => step(c, 1)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary" aria-label={`More ${c}`}><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChoiceGroup<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T | ""; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${value === o ? "border-primary bg-secondary text-primary" : "bg-card text-muted-foreground"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
