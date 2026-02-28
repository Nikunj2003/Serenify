# Serenify — AI-Powered Mental Health Companion

> An open-source, full-stack mental wellness application combining empathetic AI chat, multi-dimensional mood tracking, journaling, guided wellness sessions, and personal analytics — all with privacy-first design.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-purple?logo=vite)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-blue?logo=google)](https://ai.google.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Supabase Setup](#supabase-setup)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Overview

**Serenify** is a production-ready, open-source mental health companion app built for people who want a private, intelligent, and personalized space to track their emotional wellbeing. It uses **Google Gemini 2.5 Flash** as the AI engine and **Supabase** as the backend (Postgres + Auth + Storage + pgvector), deployed as a single-page React application on Vercel.

The app is localized with Indian crisis resources (emergency 112, iCall, Vandrevala Foundation, NIMHANS, and more) but designed to be globally usable.

> **This is not a substitute for professional mental health care.** Serenify is a self-care and wellness tool. If you are in crisis, please contact a mental health professional or local emergency services.

---

## Features

### AI Chat Companion
- **Empathetic conversational AI** powered by Google Gemini 2.5 Flash
- **RAG (Retrieval-Augmented Generation)**: Upload personal health documents (PDFs, text files) and the AI uses them as context for personalized responses
- Session management: create, search, rename, and tag multiple chat sessions
- **Crisis detection**: automatically detects distress keywords and surfaces a crisis resource banner
- Pin important messages for later reference
- Export any chat session as a `.txt` file
- AI suggests relevant wellness activities based on conversation context

### Multi-Dimensional Mood Tracking
- **5-level mood scale**: Struggling → Difficult → Okay → Good → Great
- **Three additional dimensions** per check-in: energy (1–10), anxiety (1–10), stress (1–10)
- **Trigger tagging**: select from predefined tags (work, sleep, relationships, etc.) or add a free-text context note
- **Streak system**: tracks consecutive days of activity with milestone celebrations (3/7/14/30/50/100/365 days) using canvas confetti
- **Support nudge**: automatically shows a crisis resource modal after 3 consecutive low-mood days

### Mood Insights & Analytics
- **AI-generated daily insights**: Gemini analyzes your last 10 mood logs and provides 3 actionable insights, cached per day to minimize API usage
- **7-day trend chart**: multi-line recharts graph showing mood, energy, anxiety, and stress over time
- **Top triggers pie chart**: visualize which triggers appear most frequently
- **Weekly patterns bar chart**: average mood by day of week
- **Energy vs. anxiety scatter plot**: explore correlations between dimensions
- **PDF export**: download your mood analytics as a PDF report

### Journaling
- **Rich text editor** (ReactQuill) with full formatting toolbar
- **AI-generated prompts**: personalized writing prompts based on your mood history and past entries
- **AI auto-tagging**: Gemini suggests up to 5 relevant tags from your entry content
- **AI weekly insights**: summarizes 7 days of entries into key themes, mood trends, and actionable advice
- Favorite and private entry flags
- Full-text search across all entries
- Filter by tags or favorites

### Wellness Center
- **10 pre-seeded guided sessions** across meditation, breathing exercises, yoga, and mindfulness
- AI recommends sessions based on your latest mood check-in
- Step-by-step guided session modal with activity tracking
- All completed sessions contribute to achievement progress

### Achievements & Gamification
- **5 built-in achievements**: First Step, Consistency is Key, Week Warrior, Journalist, Zen Master
- Achievements unlock automatically based on streaks, journal entries, and wellness sessions completed
- Toast notifications on unlock; confetti celebration modal for major streak milestones

### Privacy Controls
- Fine-grained control over what data the AI can access:
  - Share journal entries with AI
  - Share mood logs with AI
  - Share wellness activities with AI
- Preferences stored securely in your profile; all AI calls respect these settings

### Onboarding
- 5-step wizard: welcome → privacy/consent → data sharing → goals + bio → initial mood check-in
- Gemini generates a personalized 3-sentence user persona on completion, used to contextualize future AI responses

### Global Search
- Cmd+K / Ctrl+K shortcut opens a full search modal
- Searches across: navigation pages, journal entries, mood logs, wellness activities, chat sessions, and chat messages
- Results grouped by type with 300ms debounce

### Profile & Settings
- Edit display name and avatar
- View overall stats: streak, journal count, mood average, wellness sessions
- Light / Dark / System theme toggle
- Sign out, password reset, and account management

### Crisis Resources
- Always accessible (no login required) at `/crisis`
- Indian national helplines: iCall, Vandrevala Foundation, NIMHANS, Snehi, and more
- International directory link (findahelpline.com)
- Emergency number (112) prominently displayed
- Built-in **5-4-3-2-1 grounding exercise** and **box breathing** coping tools

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 7 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix UI), Framer Motion |
| AI | Google Gemini 2.5 Flash (chat, embeddings, tagging, insights) |
| Backend | Supabase (Postgres, Auth, Storage, RLS, pgvector) |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts, react-calendar-heatmap |
| Editor | ReactQuill |
| Markdown | react-markdown + remark-gfm + DOMPurify |
| File Upload | react-dropzone |
| PDF Export | jsPDF + html2canvas |
| Notifications | Sonner |
| Animations | canvas-confetti, Framer Motion |
| Onboarding Tour | react-joyride |
| Deployment | Vercel |

---

## Screenshots

> Screenshots coming soon. Feel free to contribute screenshots via a PR!

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or bun/pnpm)
- A **Supabase** account and project — [supabase.com](https://supabase.com)
- A **Google Gemini API key** — [Google AI Studio](https://aistudio.google.com/app/apikey)

### Clone & Install

```bash
git clone https://github.com/your-username/serenify.git
cd serenify
npm install
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Enable the **pgvector** extension in your project:
   - Go to **Database → Extensions → vector** and enable it.
3. Run the schema SQL to create all tables, triggers, functions, and seed data:
   ```bash
   # In the Supabase SQL editor, paste and run:
   cat supabase_schema.sql
   ```
4. Run the additional migration for the daily insights caching table:
   ```bash
   cat create_daily_insights_table.sql
   ```
5. Create a **Storage bucket** named `documents` (set to private).
6. Copy your **Project URL** and **anon public key** from **Settings → API**.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

> **Security note**: The Gemini API key is used client-side via the Vite environment. For production use, consider proxying AI calls through a Supabase Edge Function or serverless backend to keep your API key private.

### Run Locally

```bash
npm run dev
```

The app starts on [http://localhost:8080](http://localhost:8080).

```bash
npm run build   # Production build
npm run preview # Preview production build locally
npm run lint    # Run ESLint
```

---

## Database Schema

The full schema is in [`supabase_schema.sql`](supabase_schema.sql). Here is a high-level summary:

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase auth users with name, persona, privacy settings, onboarding state |
| `mood_logs` | Daily mood check-ins with energy, anxiety, stress, triggers |
| `journal_entries` | Rich-text journal entries with AI-generated tags |
| `mood_goals` | User-defined wellness goals |
| `chat_sessions` | AI chat session containers |
| `chat_messages` | Individual messages; supports pinning |
| `wellness_sessions` | Pre-seeded guided wellness activity templates |
| `user_activities` | Tracks completed wellness sessions |
| `achievements` | Master list of achievable badges |
| `user_achievements` | User–achievement junction table |
| `embeddings` | Gemini `embedding-001` vectors (768-dim) for RAG over documents and journals |
| `daily_insights` | Per-user, per-day cache of AI mood insights |

Row Level Security (RLS) is enabled on all user-data tables, enforcing `auth.uid() = user_id` on every query. The `match_embeddings` Postgres function performs cosine-similarity vector search for RAG.

---

## Project Structure

```
src/
├── App.tsx                  # Root router and provider setup
├── main.tsx                 # React entry point
├── pages/                   # Route-level page components
│   ├── Landing.tsx          # Public landing page
│   ├── About.tsx            # About page
│   ├── Login.tsx / Signup.tsx
│   ├── ForgotPassword.tsx / EmailConfirmation.tsx
│   ├── Onboarding.tsx       # 5-step onboarding wizard
│   ├── Dashboard.tsx        # Main hub with mood check-in
│   ├── Chat.tsx             # AI chat with session management
│   ├── Journal.tsx          # Journal list and search
│   ├── JournalNew.tsx       # New journal entry editor
│   ├── JournalEntry.tsx     # View/edit single entry
│   ├── MoodInsights.tsx     # Analytics and AI insights
│   ├── Wellness.tsx         # Wellness center
│   ├── Profile.tsx          # Profile, settings, achievements
│   └── Crisis.tsx           # Crisis resources (always public)
├── components/              # Shared UI components
│   ├── Layout.tsx           # App shell with navigation
│   ├── AuthProvider.tsx     # Supabase auth context
│   ├── ThemeProvider.tsx    # Light/dark theme
│   ├── ProtectedRoute.tsx   # Auth guard
│   ├── GlobalSearch.tsx     # Cmd+K search modal
│   ├── MoodSelector.tsx     # 5-emoji mood picker
│   ├── MoodDimensionsSelector.tsx
│   ├── MoodTriggerSelector.tsx
│   ├── MoodCalendarHeatmap.tsx
│   ├── JournalInsights.tsx  # AI weekly journal analysis
│   ├── GuidedSessionModal.tsx
│   ├── DocumentUpload.tsx   # RAG document upload
│   ├── AchievementSystem.tsx
│   ├── CelebrationModal.tsx # Streak confetti
│   ├── SupportModal.tsx     # Low-mood crisis nudge
│   ├── OnboardingTour.tsx   # react-joyride tour
│   ├── MarkdownMessage.tsx  # Safe markdown renderer
│   └── ui/                  # Full shadcn/ui component library
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── ai-service.ts        # All Gemini AI calls + RAG logic
│   ├── chat-service.ts      # Chat CRUD operations
│   ├── achievement-service.ts
│   ├── journal-prompts.ts   # Static fallback prompts
│   └── mockData.ts          # Crisis helplines data
└── hooks/
    ├── use-mobile.tsx
    └── use-toast.ts
```

---

## Deployment

The app is configured for **Vercel** out of the box. `vercel.json` includes an SPA rewrite rule so React Router handles all routes:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Deploy steps:**
1. Push your repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all three environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`) in the Vercel project settings.
4. Deploy.

The app also builds fine for any static host (Netlify, Cloudflare Pages, AWS S3 + CloudFront, etc.) — just ensure you configure the equivalent SPA fallback redirect.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and **commit** with a descriptive message.
3. **Push** to your fork and open a **Pull Request** against `main`.

### Ideas for Contributions
- [ ] Server-side AI proxy (Supabase Edge Functions) to secure the Gemini API key
- [ ] Mobile app (React Native / Expo) using the same Supabase backend
- [ ] Additional localization / crisis resources for other countries
- [ ] More achievement types and wellness session content
- [ ] Voice input for mood check-ins and journaling
- [ ] Push notification reminders for daily check-ins
- [ ] Integration with wearable device APIs (heart rate, sleep data)
- [ ] Therapist/coach portal for supervised use

Please open an issue first for large feature additions so we can discuss the approach.

---

## Disclaimer

Serenify is a personal wellness and self-care tool. It is **not a medical device** and is **not intended to diagnose, treat, cure, or prevent any mental health condition**. The AI responses are generated by a large language model and may not always be accurate or appropriate for every situation.

If you are experiencing a mental health crisis or emergency, please contact a qualified mental health professional or your local emergency services immediately. In India, call **iCall at 9152987821** or the national emergency number **112**.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Built with care for mental wellness. Open-sourced to help more people.</p>
