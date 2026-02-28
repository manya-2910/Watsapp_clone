# NHAPP — WhatsApp Web Clone

A real-time chat web application inspired by WhatsApp Web, built with React, TypeScript, Supabase, and Tailwind CSS v4.

---

## ✨ Features

- **Real-time messaging** via Supabase Realtime subscriptions
- **File sharing** — send images and documents with instant preview
- **Voice messages** — record, send, and play audio directly in chat
- **OTP Authentication** — passwordless login via Supabase Magic Link / OTP
- **Dark / Light Mode** — full theme toggle persisted in localStorage
- **Optimistic UI** — messages appear instantly before DB confirmation
- **Responsive Design** — works on desktop and mobile browsers

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, Framer Motion |
| Backend / DB | Supabase (PostgreSQL + Realtime) |
| Storage | Supabase Storage (attachments bucket) |
| Auth | Supabase Auth (OTP / Magic Link) |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repository
```bash
git clone https://github.com/manya-2910/Watsapp_clone.git
cd Watsapp_clone
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these values in your Supabase Dashboard → Project Settings → API.

### 4. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🗄️ Supabase Setup

Run the following SQL in your Supabase SQL Editor to create the required tables and policies:

```sql
-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  sender_email text,
  status text default 'SENT',
  created_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table messages;

-- Row Level Security
alter table messages enable row level security;
create policy "Users can read messages" on messages for select using (auth.role() = 'authenticated');
create policy "Users can insert messages" on messages for insert with check (auth.uid() = sender_id);
```

Also ensure you have a **Storage bucket** named `attachments` set to **Public**.

---

## 📦 Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the **Root Directory** to `/` (the repo root).
4. Add the following **Environment Variables** in Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

The `vercel.json` file handles SPA routing automatically.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx   # Main chat UI (messages, file/audio upload)
│   ├── Login.tsx           # OTP login form
│   └── SplashScreen.tsx    # Animated splash screen
├── hooks/
│   └── useAuth.ts          # Supabase auth hook
├── services/
│   └── supabaseClient.ts   # Supabase client initialization
├── App.tsx                 # Root component, routing, theme
├── main.tsx                # Entry point with Error Boundary
└── index.css               # Global styles and Tailwind theme
```

---

## 📝 License

MIT
