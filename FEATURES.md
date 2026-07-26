# Feature Summary: Idea Creation Game Platform

## Core Concept
Transform idea creation into a game-like experience where users can collaborate, compete, and earn rewards while developing their ideas in thematic "worlds".

---

## 1. Worlds & Ideas (Creations)
- **Worlds**: Thematic spaces (e.g., Forest, Digital, Obsidian) where users can post ideas.
- **Ideas (Creations)**: Each idea belongs to a world and has:
  - Title, description, status (Seed → Growing → Thriving → Launching → Shipped), mode (personal/team), public/private flag.
  - Timeline of entries (text, image, link, audio/voice notes).
  - Embedded project chat for team collaboration.
  - Task management (to-do list with priorities, assignees, deadlines).
- **Quick Plant**: Fast idea creation from world detail page.

## 2. Collaboration & Teamwork
- **Team Mode**: Switch an idea to team mode to invite collaborators.
- **Collaboration Requests**: Users can request to join any idea; owner can approve/reject.
- **Role Assignment**: Owner can assign roles (owner, admin, member) with optional deadlines and XP rewards.
- **Member Management**: View, update, remove team members; see their roles, deadlines, rewards.
- **Project Chat**: Real‑time group chat tied to each idea (persisted messages).
- **Direct Messages (DMs)**: Private 1‑on‑1 chats between users (with read receipts, unread counts).

## 3. Community Feed & Social Interaction
- **Global Feed**: Lists public ideas from all worlds, filterable by world.
- **Likes & Comments**: Users can like and comment on any public idea.
- **Feed Item Metadata**: Shows author, world, status, entries count, likes/comments counts, like state.
- **Comments Modal**: Inline comment thread with optimistic UI.

## 4. Gamification (Game‑like Progression)
- **XP & Levels**:
  - Earn XP for actions: creating ideas, commenting, liking, completing tasks, participating in events, etc.
  - Level = floor(XP / 100) + 1 (e.g., 0‑99 XP → level 1, 100‑199 → level 2).
- **Achievements (Badges)**:
  - Pre‑defined badges (First Creation, First Comment, Social Butterfly, Collaborator, Explorer, Mentor, Legend, etc.).
  - Awarded automatically when criteria met; grant XP reward.
  - Stored in `user_achievements` table.
- **Daily Quests** (optional):
  - Daily reset quests (e.g., “Post 2 ideas”, “Give 5 likes”) with XP rewards.
  - Track progress per user per day.
- **Events** (Admin‑created):
  - Time‑bound collaboration events with title, description, start/end dates, XP reward.
  - Users can join events; optionally link a creation they worked on.
  - Admins can create, update, delete events; view participants.
- **Rewards**:
  - Role‑based XP/reward text (set by idea owner).
  - Event participation awards XP.
  - Achievement XP rewards.

## 5. Administrative Features
- **Admin Users**:
  - Can promote other users to admin (limited powers) to assist the chief admin.
  - Admins can create events, moderate content (implied via RLS policies).
- **RLS (Row Level Security)**:
  - All tables protected; policies ensure users only access their own data or data they’re permitted to (e.g., creators can manage their ideas, admins see all events, etc.).
- **Admin‑only APIs**:
  - `/api/events` (POST/PATCH/DELETE) – only admins can create/modify/delete events.
  - Role assignment – only idea owner can assign roles.
  - Collaboration request moderation – only idea owner can approve/reject.

## 6. Technical Implementation Highlights
- **Backend**: Next.js API routes (REST) with Supabase (Postgres) as the database.
- **Real‑time Chat**: Currently implemented via polling (fetch) but can be upgraded to WebSockets/Socket.io.
- **Authentication**: NextAuth.js (Supabase provider) for user sessions.
- **Storage**: User uploads (images, audio) handled via `/api/upload` (Cloudinary) with fallback to data URLs.
- **Type Safety**: Shared TypeScript types for domain models (Creation, Entry, DirectMessage, etc.) and collaboration types.
- **Modular API Structure**:
  - `/api/creations` – CRUD, entries, status/mode toggles.
  - `/api/creations/[id]/members` – role management.
  - `/api/collaboration-requests` – send/request, list, approve/reject.
  - `/api/messages` – direct messaging.
  - `/api/gamification` – XP, level, achievements.
  - `/api/events` – event creation & participation.
  - `/api/feed` – public feed with liking/commenting.
- **Database Schema** (Supabase SQL):
  - Tables: users, creations, creation_members, entries, project_chat_messages, direct_messages, creation_likes, creation_comments, collaboration_requests, user_xp, achievements, user_achievements, daily_quests, events, event_participations, push_subscriptions, dump_items, tasks.
  - Indexes on foreign keys and query‑friendly columns.
  - Row Level Security enabled on all tables.

## 7. User Experience (Game‑like Touches)
- **Visual Themes**: Each world has unique icon, colour, description.
- **Progress Indicators**: XP bar, level display, achievement toast notifications.
- **Feedback**: Optimistic UI for likes/comments, loading skeletons, smooth scrolling.
- **Engagement Calls‑to‑Action**: Quick Plant bar, “Start collaborating!” prompts, event banners.
- **Audio/Voice Notes**: Real audio recording with waveform visualization or simulated stub playback.
- **Image Lightbox & Link Previews**.
- **Todo‑style Task Board** inside each idea (via ProductionTab component).

## 8. Future Enhancements
- Replace polling‑based chat with true WebSocket (Socket.io) for low‑latency messaging.
- Add leaderboards (global & per‑world).
- Introduce virtual currency or item drops for special achievements.
- Allow worlds to be user‑created or customized.
- Add tournaments or seasonal events with exclusive rewards.
- Enable idea fork/remix functionality (branch off an existing idea).
- Integrate with external CI/CD or dev‑tools for technical idea tracking.

---  
*This document captures the feature set as implemented or planned via the schema and API additions.*