import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Globe,
  Trash2,
  ListChecks,
  Bell,
  Mic,
} from "lucide-react";

export interface TutorialStep {
  icon: LucideIcon;
  title: string;
  body: string;
  points: string[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: Sparkles,
    title: "Capture an idea",
    body: "Grove is a garden for your ideas. Every spark starts on the home screen.",
    points: [
      "Type a thought into the capture box on the Ecosystem (home) page.",
      "Give it a name and pick a World, or skip it straight into The Dump.",
      "Each idea becomes a 'creation' that grows from Seed → Growing → Thriving → Shipped.",
    ],
  },
  {
    icon: Globe,
    title: "Organise with Worlds",
    body: "Worlds are categories for your creations — Product, Design, Writing, Music, Games, Business and Personal.",
    points: [
      "Open Worlds to see how active each domain is.",
      "A World stays 'Healthy' while it has recent activity, and 'Frozen' if left idle.",
      "Tap a World to browse or quick-plant a new creation inside it.",
    ],
  },
  {
    icon: Mic,
    title: "Add entries to a creation",
    body: "Open any creation to build it out over time.",
    points: [
      "Add text notes, images, links, or record a voice note.",
      "Adding an entry automatically nudges a Seed forward to Growing.",
      "Everything is saved to your account, so it follows you across devices.",
    ],
  },
  {
    icon: ListChecks,
    title: "Plan with the Production tab",
    body: "Inside a creation, the Production tab turns an idea into a real project.",
    points: [
      "Build a to-do list of tasks for the project.",
      "Set a priority on each task: Low, Medium, High, or Urgent.",
      "Give tasks start/due dates and watch the timeline track your progress.",
    ],
  },
  {
    icon: Trash2,
    title: "The Dump & reviving ideas",
    body: "Not every idea is ready. The Dump is fertile soil for the rest.",
    points: [
      "Send half-formed thoughts to The Dump to revisit later.",
      "Ideas left untouched for 90 days drift into The Dump automatically.",
      "Use 'Unearth' to resurface a random buried idea when you need inspiration.",
    ],
  },
  {
    icon: Bell,
    title: "Reminders & notifications",
    body: "Grove can nudge you back to your ideas — even when the app is closed.",
    points: [
      "Turn on Reminders to get push notifications at random intervals.",
      "Notifications work online and offline once you allow them.",
      "Admins can also send announcements straight to your notifications.",
    ],
  },
];
