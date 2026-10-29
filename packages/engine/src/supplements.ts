import type { Numbers } from "./calc";
import type { Profile } from "./types";

export type Grade = "strong" | "moderate" | "limited" | "avoid";
export interface Supplement {
  name: string;
  grade: Grade;
  /** True when this supplement is relevant to the user's profile. */
  relevant: boolean;
  why: string;
  dose: string;
  caution: string;
  source: string;
}

export function buildSupplements(p: Profile, n: Numbers): Supplement[] {
  if (n.numbersHidden) return []; // under 18 or pregnant: doctor-led only
  const female = p.sex === "female";
  const over50 = p.age >= 50;
  const list: Supplement[] = [
    {
      name: "Vitamin D",
      grade: "moderate",
      relevant: p.sun === "low" || over50 || p.diet === "vegan",
      why:
        p.sun === "low"
          ? "You get little sun, which is the main way the body makes vitamin D."
          : over50
            ? "Skin makes less vitamin D with age."
            : "Useful if you get little sun or have darker skin.",
      dose: "600–800 IU (15–20 mcg) a day is the adult RDA. Don't go above 4,000 IU without a blood test.",
      caution: "A simple blood test tells you if you're actually low.",
      source: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
    },
    {
      name: "Creatine monohydrate",
      grade: "strong",
      relevant: true,
      why: "The best-studied sports supplement. Improves strength and muscle gains when combined with resistance training.",
      dose: "3–5 g a day, any time. No loading phase needed.",
      caution: p.condition
        ? "Check with your doctor first, especially with kidney disease."
        : "May add 1–2 kg of water weight in muscle early on. That's not fat.",
      source: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z",
    },
    {
      name: "Protein powder",
      grade: "strong",
      relevant: true,
      why: `Only a convenience. Your target is ${n.proteinG[0]}–${n.proteinG[1]} g of protein a day; powder helps if food alone falls short.`,
      dose: p.diet === "vegan" || p.dairyFree ? "20–40 g per serving. Choose soy or pea protein." : "20–40 g per serving. Whey, or soy/pea if you avoid dairy.",
      caution: "Choose third-party tested brands (e.g. Informed Sport, NSF Certified for Sport).",
      source: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
    },
    {
      name: "Vitamin B12",
      grade: "strong",
      relevant: p.diet !== "omni" || over50,
      why:
        p.diet === "vegan"
          ? "B12 is found almost only in animal foods, so vegans need a supplement or fortified foods."
          : p.diet === "veg"
            ? "Vegetarians often run low on B12."
            : over50
              ? "Absorption from food drops after 50."
              : "Needed if you eat little or no animal food, or are over 50.",
      dose: "Adult RDA is 2.4 mcg; supplements commonly provide 25–250 mcg a day.",
      caution: "Metformin and acid-reducing medicines lower B12 absorption.",
      source: "https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/",
    },
    {
      name: "Omega-3 (fish or algae oil)",
      grade: "moderate",
      relevant: p.fish === "rare" || p.diet !== "omni",
      why: "Supports heart health and lowers triglycerides. Eating oily fish twice a week is the first choice.",
      dose: p.diet === "omni" ? "About 250–500 mg EPA + DHA a day." : "About 250–500 mg EPA + DHA a day from algae oil.",
      caution: "Talk to a doctor if you take blood thinners.",
      source: "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/",
    },
    {
      name: "Folic acid",
      grade: "strong",
      relevant: female && p.age <= 45,
      why: "Recommended for anyone who could become pregnant, to prevent serious birth defects of the brain and spine.",
      dose: "400 mcg a day.",
      caution: "Your doctor may advise a higher dose in some situations.",
      source: "https://www.cdc.gov/folic-acid/about/index.html",
    },
    {
      name: "Calcium",
      grade: "moderate",
      relevant: p.diet === "vegan" || p.dairyFree || (female && over50),
      why: "Get it from food first: dairy, fortified plant milk, tofu, leafy greens. Supplement only to fill a gap.",
      dose: "Adults need 1,000–1,200 mg a day from all sources. Take supplements in doses of 500 mg or less.",
      caution: "Too much from supplements may raise kidney stone risk.",
      source: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
    },
    {
      name: "Caffeine (pre-workout)",
      grade: "strong",
      relevant: false,
      why: "Reliably improves endurance and strength performance. Coffee works as well as pills.",
      dose: "3–6 mg per kg body weight, 30–60 min before training. Keep total under 400 mg a day.",
      caution: "Avoid with heart rhythm problems, high blood pressure, anxiety, or late in the day.",
      source: "https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00383-4",
    },
    {
      name: "Iron",
      grade: "limited",
      relevant: false,
      why: female
        ? "Menstruating women and vegetarians are at higher risk of low iron, but only supplement if a blood test shows you're low."
        : "Men rarely need iron, and excess iron is harmful.",
      dose: "Only as directed after a blood test.",
      caution: "Keep iron supplements away from children: overdose is dangerous.",
      source: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
    },
    {
      name: "Multivitamin",
      grade: "limited",
      relevant: false,
      why: "Large studies show no clear benefit for preventing heart disease or cancer in healthy adults who eat a varied diet.",
      dose: "If you take one, pick a basic one that stays at or below 100% of daily values.",
      caution: "It doesn't replace a balanced diet.",
      source:
        "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/vitamin-supplementation-to-prevent-cvd-and-cancer-preventive-medication",
    },
    {
      name: "Fat burners, detox teas, “test boosters”",
      grade: "avoid",
      relevant: false,
      why: "No good evidence they work, and some contain hidden stimulants or drugs.",
      dose: "Skip them.",
      caution: "The FDA regularly finds unlisted drugs in weight-loss and muscle-building products.",
      source: "https://www.fda.gov/consumers/health-fraud-scams/tainted-products-marketed-consumers",
    },
  ];
  return list;
}
