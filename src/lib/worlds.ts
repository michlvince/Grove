export type WorldId =
  | "product"
  | "design"
  | "writing"
  | "music"
  | "games"
  | "business"
  | "personal"
  | "dump";

export interface World {
  id: WorldId;
  name: string;
  icon: string;
  description: string;
}

export const DEFAULT_WORLDS: World[] = [
  { id: "product", name: "Product", icon: "Boxes", description: "Apps, services, physical goods, and digital creations." },
  { id: "design", name: "Design", icon: "Palette", description: "UI, layouts, branding, art, and visual concepts." },
  { id: "writing", name: "Writing", icon: "PenTool", description: "Essays, stories, documentation, scripts, and logs." },
  { id: "music", name: "Music", icon: "Music", description: "Beats, lyrics, melodies, soundscapes, and tracks." },
  { id: "games", name: "Games", icon: "Gamepad2", description: "Mechanics, levels, lore, rules, and game ideas." },
  { id: "business", name: "Business", icon: "TrendingUp", description: "Ventures, models, strategies, marketing, and monetization." },
  { id: "personal", name: "Personal", icon: "User", description: "Habits, goals, reminders, journals, and reflections." },
  { id: "dump", name: "The Dump", icon: "Trash2", description: "A fertile soil for uncategorized thoughts and sleeping ideas." },
];
