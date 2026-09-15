 ⏳ The Last-Minute Life Saver

An AI-powered deadline assistant that turns panic into a plan. Give it a task and a deadline — it uses Google's **Gemini API** to instantly break the task into 3–5 bite-sized, time-estimated action steps, so you know exactly what to do first when time is tight.

Built for the **GDG Technical / AI-ML** track.

---

## 💡 The Problem

Procrastination isn't usually about laziness — it's about a task feeling too big and vague to start. "Finish the physics lab report" is overwhelming. "Write the intro paragraph (10 min)" is not.

**Last-Minute Life Saver** removes that friction by using an LLM to instantly turn any vague task into a concrete, chronological checklist with realistic time estimates.

## ✨ Features

- **AI Task Breakdown** — Enter a task + deadline, and Gemini (`gemini-3.5-flash`) returns 3–5 actionable sub-steps with time estimates, using structured JSON output (via `responseSchema`) for reliable parsing.
- **Live Urgency Tracking** — A real-time countdown per task, color-coded by how much time is left (calm green → warning yellow → pulsing red when overdue).
- **Quick-Start Presets** — One-click sample tasks (e.g. "Prepare Slide Deck for Team Pitch") for fast demoing.
- **Persistent State** — Tasks and progress are saved to `localStorage`, so nothing is lost on refresh.
- **Step-by-Step Checklist** — Check off each AI-generated sub-step as you complete it.
- **Playful Loading States** — Rotating status messages ("Negotiating with procrastination impulses...") while the AI generates your plan.

## 🧠 How the AI Integration Works

1. User submits a task title + deadline.
2. The Express backend (`server.ts`) sends a prompt to the Gemini API asking it to break the task into 3–5 short, chronological, actionable sub-steps.
3. Gemini responds with **structured JSON** (`responseSchema` enforces `{ title: string, duration: number }[]`), so the response can be parsed directly — no fragile text parsing.
4. The steps are rendered in the UI as an interactive, checkable list.

```
User task + deadline
        │
        ▼
POST /api/breakdown  →  Gemini API (gemini-3.5-flash)
        │
        ▼
Structured JSON: [{ title, duration }, ...]
        │
        ▼
Rendered as an interactive checklist
```

## 🛠️ Tech Stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Animation  | Motion (Framer Motion successor)         |
| Icons      | lucide-react                             |
| Backend    | Express + Vite middleware                |
| AI         | Google Gemini API (`@google/genai`)      |

## 🚀 Run Locally

**Prerequisites:** Node.js

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Get a [Gemini API key](https://aistudio.google.com/app/apikey) and add it to a `.env.local` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

## 🔭 Possible Next Steps

- Add auth so tasks sync across devices instead of relying on `localStorage`.
- Let users regenerate or edit AI-suggested steps.
- Push notifications as a deadline approaches.
- Track completion stats over time (e.g. "you finish tasks with an average of X minutes to spare").

## 🙋 Why This Fits AI/ML

This project isn't just calling an API — it demonstrates **structured output generation** with an LLM (constraining Gemini's response to a strict JSON schema), which is a practical pattern for building reliable AI features rather than parsing freeform text.

---

Built with [Google AI Studio](https://ai.studio/) · [React](https://react.dev/) · [Gemini API](https://ai.google.dev/)
