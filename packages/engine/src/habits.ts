import type { Numbers } from "./calc";

export interface Habit {
  name: string;
  target: string;
  detail: string;
}

export function buildHabits(n: Numbers): { habits: Habit[]; checks: { name: string; when: string }[] } {
  const sugarG = n.targetKcal ? Math.round((n.targetKcal * 0.1) / 4) : null;
  return {
    habits: [
      { name: "Sleep", target: "7–9 h", detail: "Adults who sleep less than 7 hours have higher risk of weight gain, high blood pressure and poor recovery." },
      { name: "Steps", target: "7,000–10,000", detail: "Studies of daily steps show lower death risk up to about this range. Add 1,000 a day each week if you're below it." },
      { name: "Fruit & vegetables", target: "5+ portions", detail: "The WHO recommends at least 400 g a day. A portion is about a handful." },
      { name: "Fibre", target: "25–35 g", detail: "From beans, oats, whole grains, fruit and veg. Keeps you full and supports gut health." },
      { name: "Added sugar", target: "< 10% kcal", detail: sugarG ? `Under about ${sugarG} g a day for you. Sugary drinks are the easiest place to cut.` : "Sugary drinks are the easiest place to cut." },
      { name: "Salt", target: "< 5 g", detail: "About one teaspoon a day (WHO). Most comes from processed and restaurant food." },
      { name: "Alcohol", target: "Less is better", detail: "Alcohol adds calories and harms sleep and recovery. No level benefits health." },
      { name: "Strength", target: "2+ days", detail: "Muscle-strengthening on 2 or more days a week is part of the WHO guidelines." },
    ],
    checks: [
      { name: "Blood pressure", when: "At least every 1–2 years from age 18" },
      { name: "Blood sugar", when: "From age 35 if overweight, or earlier with risk factors" },
      { name: "Cholesterol", when: "From age 20–40 depending on risk; ask your doctor" },
    ],
  };
}

export const SOURCES = [
  { title: "WHO guidelines on physical activity and sedentary behaviour (2020)", url: "https://www.who.int/publications/i/item/9789240015128", usedFor: "Weekly cardio and strength targets, balance work for 65+, youth activity" },
  { title: "Mifflin et al., 1990: resting energy expenditure equation", url: "https://pubmed.ncbi.nlm.nih.gov/2305711/", usedFor: "BMR calculation" },
  { title: "ISSN position stand: protein and exercise (2017)", url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8", usedFor: "Protein targets and spreading protein across meals" },
  { title: "ISSN position stand: nutrient timing (2017)", url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0189-4", usedFor: "Pre- and post-workout eating" },
  { title: "ISSN position stand: creatine (2017)", url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z", usedFor: "Creatine safety and dose" },
  { title: "ISSN position stand: caffeine (2021)", url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00383-4", usedFor: "Caffeine 3–6 mg/kg" },
  { title: "ACSM position stand: progression models in resistance training", url: "https://pubmed.ncbi.nlm.nih.gov/19204579/", usedFor: "Sets, reps and progression by experience" },
  { title: "Dietary Reference Intakes: macronutrients (National Academies)", url: "https://nap.nationalacademies.org/catalog/10490", usedFor: "Fat 20–35% of energy, fibre 14 g per 1,000 kcal" },
  { title: "NIH Office of Dietary Supplements fact sheets", url: "https://ods.od.nih.gov/factsheets/list-all/", usedFor: "Vitamin D, B12, calcium, iron, omega-3 doses and limits" },
  { title: "USPSTF: vitamin supplementation to prevent heart disease and cancer (2022)", url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/vitamin-supplementation-to-prevent-cvd-and-cancer-preventive-medication", usedFor: "Multivitamin evidence" },
  { title: "WHO healthy diet fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet", usedFor: "Fruit & veg, sugar, salt" },
  { title: "IARC: carcinogenicity of red and processed meat (2015)", url: "https://www.iarc.who.int/wp-content/uploads/2018/07/pr240_E.pdf", usedFor: "Limiting processed meat" },
  { title: "Schoenfeld, Ogborn & Krieger, 2017: weekly training volume and muscle growth (meta-analysis)", url: "https://doi.org/10.1080/02640414.2016.1210197", usedFor: "Weekly sets per muscle (about 10–20) and the volume check" },
  { title: "Schoenfeld, Ogborn & Krieger, 2016: training frequency and muscle growth (meta-analysis)", url: "https://pubmed.ncbi.nlm.nih.gov/27102172/", usedFor: "Training each muscle about twice a week" },
  { title: "Barakat et al., 2020: body recomposition in trained individuals", url: "https://doi.org/10.1519/SSC.0000000000000584", usedFor: "Recomp calories, high protein and who recomp suits" },
  { title: "Iraki et al., 2019: nutrition for building muscle (off-season bodybuilding)", url: "https://pubmed.ncbi.nlm.nih.gov/31247944/", usedFor: "Lean-gain surplus, 0.25–0.5% weight gain per week, protein 1.6–2.2 g/kg" },
  { title: "Morton et al., 2018: protein supplementation and muscle gains (meta-analysis)", url: "https://pubmed.ncbi.nlm.nih.gov/28698222/", usedFor: "Protein for muscle gain" },
  { title: "Paluch et al., 2022, Lancet Public Health: daily steps and mortality", url: "https://pubmed.ncbi.nlm.nih.gov/35247352/", usedFor: "Step targets" },
];
