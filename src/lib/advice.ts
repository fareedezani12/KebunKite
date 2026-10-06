import { CROP_META } from "./planner";

type Ctx = { technique?: string | null; skill?: string | null; crops: string[] };

export const SUGGESTED = [
  "What should I plant?",
  "When should I plant?",
  "How often should I water?",
  "Which crops are beginner friendly?",
  "What should I do if leaves turn yellow?",
  "Which crops work well in hydroponics?",
];

export function answer(q: string, ctx: { technique?: string | null | undefined; skill?: string | null | undefined; crops: string[] }): string {
  const t = q.toLowerCase();
  const tech = ctx.technique ?? "Soil";
  const skill = ctx.skill ?? "Beginner";
  const mine = ctx.crops.length ? ctx.crops.join(", ") : "leafy greens like Kangkung and Sawi";

  if (t.includes("yellow")) {
    return `Yellow leaves usually point to one of three things:\n\n• **Overwatering** — if the soil stays soggy, let the top 2 cm dry before watering again.\n• **Nitrogen deficiency** — older, lower leaves yellow first. Add compost or a diluted organic fertiliser every 2 weeks.\n• **Too little light** — leafy greens need 4–6 hours of sun.\n\n${tech === "Hydroponics" ? "In hydroponics, check your nutrient solution strength (EC) and pH (aim for 5.8–6.5)." : "Remove badly yellowed leaves so the plant puts energy into new growth."}`;
  }
  if (t.includes("water")) {
    const base = tech === "Pot" ? "Pots dry out faster — water once or twice a day in hot weather, ideally early morning." : tech === "Hydroponics" ? "Hydroponic systems don't need watering, but top up the reservoir and refresh the nutrient solution every 1–2 weeks." : "Water soil beds once daily in the morning; twice on very hot afternoons.";
    return `${base}\n\nLeafy greens (Kangkung, Bayam, Sawi) like consistently moist roots. Fruiting crops (Tomato, Chilli) prefer deeper, less frequent watering. Poke a finger 2 cm into the soil — if it's dry, it's time.`;
  }
  if (t.includes("beginner") || t.includes("easy")) {
    const easy = Object.entries(CROP_META).filter(([, m]) => m.difficulty === 1).map(([c, m]) => `• **${c}** — ready in ${m.minDays}–${m.maxDays} days`);
    return `These crops are forgiving and fast — great for building confidence:\n\n${easy.join("\n")}\n\nKangkung is the easiest: it grows quickly and regrows after you cut it.`;
  }
  if (t.includes("hydro")) {
    const h = Object.entries(CROP_META).filter(([, m]) => m.techniques.includes("Hydroponics")).map(([c]) => c);
    return `Leafy vegetables do best in hydroponics: **${h.join(", ")}**.\n\nThey have shallow roots, short cycles and don't need support. Avoid root crops like Carrot and climbing crops like Long Bean in simple NFT or Kratky setups.`;
  }
  if (t.includes("when")) {
    return `In Malaysia's tropical climate you can plant year-round. A few tips:\n\n• Sow leafy greens every 2–3 weeks so your community has a **continuous harvest**.\n• Avoid transplanting seedlings during the hottest midday hours — plant late afternoon.\n• During monsoon months, raise beds or move pots under shelter to prevent waterlogging.\n\nYour KebunKite schedule sets planting dates automatically once you accept a plan.`;
  }
  if (t.includes("plant") || t.includes("grow") || t.includes("what")) {
    return `Based on your profile (**${tech}**, **${skill}**), I'd focus on ${mine}.\n\n${skill === "Beginner" ? "Start with 2–3 fast leafy crops before adding fruiting crops like Tomato or Chilli." : "You can mix fast leafy greens with higher-value fruiting crops like Chilli and Tomato."}\n\nFor a plan sized to your community's needs, try the **Community Kebun Planner**.`;
  }
  if (t.includes("pest") || t.includes("insect") || t.includes("hole")) {
    return `For holes in leaves, check the undersides for caterpillars and aphids. Pick them off by hand, or spray a mild mix of water with a few drops of dish soap. Neem oil every 5–7 days works well as an organic option.`;
  }
  return `Good question! I can help with what to plant, planting times, watering, yellow leaves, pests, and hydroponics. Try one of the suggested questions, or ask about a specific crop like ${mine.split(",")[0]}.`;
}

export type HealthResult = { status: string; issue: string; action: string; confidence: number };

export const SYMPTOMS = ["Looks normal", "Yellow leaves", "Wilting / drooping", "Brown spots", "Pale / slow growth"] as const;

export function analyzePlant(crop: string, symptom: string, seed: number): HealthResult {
  const conf = 70 + (seed % 20);
  switch (symptom) {
    case "Yellow leaves":
      return { status: "Possible Nutrient Deficiency", issue: `Older ${crop} leaves yellowing suggests low nitrogen.`, action: "Apply compost or diluted organic fertiliser, and check that the soil isn't waterlogged.", confidence: conf };
    case "Wilting / drooping":
      return { status: "Possible Watering Issue", issue: "Possible watering stress.", action: "Check soil moisture and adjust watering frequency. Water early morning and provide shade during the hottest hours.", confidence: conf };
    case "Brown spots":
      return { status: "Needs Attention", issue: "Spots may indicate fungal leaf spot from wet foliage.", action: "Remove affected leaves, water at the base instead of overhead, and improve airflow between plants.", confidence: conf - 5 };
    case "Pale / slow growth":
      return { status: "Needs Attention", issue: "Plant may not be getting enough light or nutrients.", action: "Move to a spot with 4–6 hours of sun and feed with balanced fertiliser every 2 weeks.", confidence: conf - 8 };
    default:
      return { status: "Healthy", issue: `No visible issues detected on your ${crop}.`, action: "Keep up your routine — consistent watering and a light feed every 2 weeks.", confidence: conf + 5 };
  }
}
