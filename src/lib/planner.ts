export type Technique = "Pot" | "Soil" | "Hydroponics";
export type Skill = "Beginner" | "Intermediate" | "Expert";

export const CROP_NAMES = [
  "Kangkung", "Sawi", "Bayam", "Kailan", "Lettuce",
  "Tomato", "Chilli", "Cucumber", "Long Bean", "Carrot",
] as const;

type Meta = {
  difficulty: 1 | 2 | 3;
  perPerson: number; // plants per household member
  areaPerPlant: number; // m² per plant in soil
  yieldKg: number; // kg per plant per cycle
  techniques: Technique[];
  minDays: number;
  maxDays: number;
};

export const CROP_META: Record<string, Meta> = {
  Kangkung: { difficulty: 1, perPerson: 2, areaPerPlant: 0.25, yieldKg: 0.35, techniques: ["Pot", "Soil", "Hydroponics"], minDays: 25, maxDays: 30 },
  Sawi: { difficulty: 1, perPerson: 1.5, areaPerPlant: 0.3, yieldKg: 0.3, techniques: ["Pot", "Soil", "Hydroponics"], minDays: 30, maxDays: 40 },
  Bayam: { difficulty: 1, perPerson: 1.5, areaPerPlant: 0.25, yieldKg: 0.3, techniques: ["Pot", "Soil", "Hydroponics"], minDays: 25, maxDays: 35 },
  Kailan: { difficulty: 2, perPerson: 1, areaPerPlant: 0.35, yieldKg: 0.3, techniques: ["Pot", "Soil", "Hydroponics"], minDays: 45, maxDays: 55 },
  Lettuce: { difficulty: 1, perPerson: 1, areaPerPlant: 0.3, yieldKg: 0.25, techniques: ["Pot", "Soil", "Hydroponics"], minDays: 35, maxDays: 45 },
  Tomato: { difficulty: 2, perPerson: 0.75, areaPerPlant: 0.6, yieldKg: 2.5, techniques: ["Pot", "Soil"], minDays: 60, maxDays: 80 },
  Chilli: { difficulty: 2, perPerson: 0.5, areaPerPlant: 0.5, yieldKg: 1, techniques: ["Pot", "Soil"], minDays: 75, maxDays: 90 },
  Cucumber: { difficulty: 2, perPerson: 0.5, areaPerPlant: 0.8, yieldKg: 2, techniques: ["Soil"], minDays: 45, maxDays: 55 },
  "Long Bean": { difficulty: 2, perPerson: 0.75, areaPerPlant: 0.5, yieldKg: 0.8, techniques: ["Soil"], minDays: 50, maxDays: 60 },
  Carrot: { difficulty: 3, perPerson: 3, areaPerPlant: 0.05, yieldKg: 0.1, techniques: ["Soil"], minDays: 70, maxDays: 80 },
};

export type PlannerInput = {
  householdMembers: number;
  growingArea: number;
  technique: Technique;
  skill: Skill;
  needs: Record<string, number>; // crop -> quantity needed
};

export type Recommendation = {
  crop: string;
  quantity: number;
  harvestDays: number;
  harvestRange: string;
  reason: string;
  suitability: "High" | "Medium" | "Low";
  expectedKg: number;
};

const skillMax: Record<Skill, number> = { Beginner: 1, Intermediate: 2, Expert: 3 };

/** Deterministic, rule-based community crop planner. */
export function generatePlan(input: PlannerInput): Recommendation[] {
  const members = Math.max(1, input.householdMembers || 1);
  const area = Math.max(2, input.growingArea || 5);
  const areaFactor = input.technique === "Hydroponics" ? 0.5 : input.technique === "Pot" ? 1.3 : 1;
  const maxCrops = Math.min(8, Math.max(2, Math.round(area / 5) + 1));

  const scored = Object.entries(CROP_META)
    .filter(([, m]) => m.techniques.includes(input.technique))
    .map(([crop, m]) => {
      const demand = input.needs[crop] ?? 0;
      let score = demand > 0 ? 50 + demand * 2 : 0;
      if (m.difficulty <= skillMax[input.skill]) score += 15;
      else score -= 20;
      if (input.technique === "Hydroponics" && m.techniques.length === 3) score += 10;
      if (m.difficulty === 1) score += 5;
      return { crop, m, demand, score };
    })
    .filter((c) => c.demand > 0 || c.score > 15)
    .sort((a, b) => b.score - a.score);

  const requested = scored.filter((c) => c.demand > 0);
  const extras = scored.filter((c) => c.demand === 0);
  const picks = [...requested, ...extras].slice(0, Math.max(maxCrops, requested.length));

  const capacity = area / areaFactor;
  let used = 0;
  const out: Recommendation[] = [];
  for (const p of picks) {
    let qty = Math.max(p.demand, Math.ceil(members * p.m.perPerson));
    if (p.m.difficulty > skillMax[input.skill]) qty = Math.max(1, Math.round(qty * 0.6));
    const remaining = capacity - used;
    const maxByArea = Math.floor(remaining / p.m.areaPerPlant);
    if (maxByArea < 1) break;
    qty = Math.min(qty, maxByArea);
    used += qty * p.m.areaPerPlant;

    const reasons: string[] = [];
    if (p.demand > 0) reasons.push(p.demand >= 6 ? "High household demand" : "Requested by households");
    else reasons.push("Fills spare growing space");
    if (p.m.difficulty === 1 && input.skill === "Beginner") reasons.push("beginner-friendly");
    else if (p.m.difficulty <= skillMax[input.skill]) reasons.push(`suits ${input.skill.toLowerCase()} growers`);
    else reasons.push("start small — needs more experience");
    if (input.technique === "Hydroponics" && p.m.techniques.includes("Hydroponics")) reasons.push("thrives in hydroponics");
    else if (input.technique === "Pot") reasons.push("container-friendly");

    const suitability: Recommendation["suitability"] =
      p.m.difficulty <= skillMax[input.skill] ? (p.demand > 0 || p.m.difficulty === 1 ? "High" : "Medium") : "Low";

    const text = reasons.join(", ");
    out.push({
      crop: p.crop,
      quantity: qty,
      harvestDays: p.m.minDays,
      harvestRange: `${p.m.minDays}–${p.m.maxDays} days`,
      reason: text.charAt(0).toUpperCase() + text.slice(1) + ".",
      suitability,
      expectedKg: Math.round(qty * p.m.yieldKg * 10) / 10,
    });
  }
  return out;
}

export function expectedKg(crop: string, qty: number) {
  return Math.round((CROP_META[crop]?.yieldKg ?? 0.3) * qty * 10) / 10;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export const ACTIVITIES = ["Prepare", "Plant", "Water", "Monitor", "Harvest"] as const;

export function scheduleFor(crop: string, start = new Date()) {
  const m = CROP_META[crop];
  const harvestOffset = 1 + (m?.minDays ?? 30);
  const offsets: Record<string, number> = { Prepare: 0, Plant: 1, Water: 3, Monitor: 10, Harvest: harvestOffset };
  return ACTIVITIES.map((a) => ({
    activity: a,
    planting_date: addDays(start, offsets[a] ?? 0),
    expected_harvest_date: addDays(start, harvestOffset),
  }));
}
