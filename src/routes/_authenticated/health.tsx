import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Sparkles, HeartPulse, AlertTriangle, CheckCircle2, Droplets, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/kebun";
import { CROP_NAMES } from "@/lib/planner";
import { analyzePlant, SYMPTOMS, type HealthResult } from "@/lib/advice";

export const Route = createFileRoute("/_authenticated/health")({
  head: () => ({ meta: [{ title: "Plant Health Analysis — KebunKite" }, { name: "description", content: "AI-assisted plant health check for your crops." }] }),
  component: Health,
});

function Health() {
  const [crop, setCrop] = useState<string>("Kangkung");
  const [symptom, setSymptom] = useState<string>("Wilting / drooping");
  const [img, setImg] = useState<{ url: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImg({ url: URL.createObjectURL(file), size: file.size });
    setResult(null);
  }

  function analyze() {
    setBusy(true);
    setResult(null);
    setTimeout(() => {
      setResult(analyzePlant(crop, symptom, img?.size ?? crop.length * 7));
      setBusy(false);
    }, 1100);
  }

  const Icon = result?.status === "Healthy" ? CheckCircle2 : result?.status.includes("Water") ? Droplets : result?.status.includes("Nutrient") ? FlaskConical : AlertTriangle;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Plant Health Analysis" subtitle="Snap a photo and get an instant care suggestion." back />
      <div className="flex items-center gap-2 rounded-xl bg-sun/20 px-3 py-2 text-xs font-medium text-sun-foreground">
        <Sparkles className="h-4 w-4" /> AI-assisted prototype — suggestions are guidance, not a diagnosis.
      </div>

      <label className="card-surface flex cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed text-center">
        {img ? (
          <img src={img.url} alt="Selected plant" className="h-56 w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-10 text-muted-foreground">
            <Camera className="h-8 w-8 text-fresh" />
            <span className="text-sm font-medium">Upload or take a plant photo</span>
            <span className="text-xs">Optional</span>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      </label>

      <div className="card-surface space-y-4 p-5">
        <div className="space-y-1.5">
          <Label>Crop</Label>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
            {CROP_NAMES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>What do you notice?</Label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button key={s} type="button" onClick={() => setSymptom(s)} className={`rounded-full border px-3 py-1.5 text-sm ${symptom === s ? "border-primary bg-secondary text-primary" : "bg-card text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>
        <Button onClick={analyze} size="lg" className="h-12 w-full" disabled={busy}>
          <HeartPulse className="mr-1 h-4 w-4" />{busy ? "Analyzing…" : "Analyze Plant"}
        </Button>
      </div>

      {result && (
        <div className="card-surface overflow-hidden">
          <div className={`flex items-center gap-3 p-4 ${result.status === "Healthy" ? "bg-secondary text-primary" : "bg-sun/25 text-sun-foreground"}`}>
            <Icon className="h-6 w-6" />
            <div>
              <p className="text-xs font-medium opacity-80">Plant Status</p>
              <p className="font-display text-lg font-semibold">{result.status}</p>
            </div>
            <span className="ml-auto text-xs font-semibold">{result.confidence}% confidence</span>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <div><p className="font-semibold">Possible issue</p><p className="text-muted-foreground">{result.issue}</p></div>
            <div><p className="font-semibold">Recommended action</p><p className="text-muted-foreground">{result.action}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

