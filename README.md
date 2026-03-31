# 🌙 Friday Night Plan

A fun, interactive web app for planning Friday nights with your kids!

## Features

- **Pre-loaded plan** with dinner, a movie at the theater, and bedtime at 8:30 PM
- **Add activities** – pick an emoji, set a title, time, and optional notes
- **Edit activities** inline
- **Remove activities** you no longer need
- **Timeline view** that shows the evening at a glance
- **Save plans** to build a history of past Friday nights
- **Predict** next Friday's plan using an LSTM neural network

## Architecture

| Part | Stack |
|------|-------|
| **Frontend** | React + Vite |
| **Backend** | Node.js + Express + SQLite (`better-sqlite3`) |

---

## Local Development

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server && npm install
```

### 3. Run everything together

```bash
npm run dev:all
```

This starts the Express API server on **port 3001** and the Vite dev server on **port 5173**.  
The Vite dev proxy automatically forwards all `/api/*` requests to the Express server.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploying to Vercel (frontend) + Railway or Render (backend)

The frontend deploys to Vercel as a static site.  
The backend needs a persistent Node.js host with filesystem access for its SQLite database — **Vercel Serverless Functions cannot be used for the backend** because their filesystem is ephemeral. Use [Railway](https://railway.app) or [Render](https://render.com) instead.

### Step 1 – Deploy the backend

#### Option A: Railway

1. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
2. In the service settings, set **Root Directory** to `server`.
3. Railway detects the `npm start` script automatically and runs `node index.js`.
4. Once deployed, copy the public URL (e.g. `https://fridaynight-server.up.railway.app`).

#### Option B: Render

1. Go to [render.com](https://render.com) and create a new **Web Service** from your GitHub repo.
2. Configure the service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Deploy and copy the public URL.

### Step 2 – Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
2. Vercel auto-detects Vite. Leave build settings at their defaults:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the following **Environment Variable** in **Project Settings → Environment Variables**:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | Public URL of your backend with **no trailing slash** (e.g. `https://fridaynight-server.up.railway.app`) |

4. Click **Deploy** (or trigger a redeploy if the project already exists).  
   The frontend will now call your backend for all `/api/*` requests.

### Step 3 – Restrict CORS to your Vercel domain (optional)

The backend allows all origins by default. To lock it down, set the `ALLOWED_ORIGIN` environment variable on your backend service:

```
ALLOWED_ORIGIN=https://your-app.vercel.app
```

---

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_API_URL` | Frontend (Vercel) | Base URL of the backend API, no trailing slash. Omit for local dev — the Vite proxy handles it automatically. |
| `PORT` | Backend | Port the Express server listens on. Defaults to `3001`. |
| `ALLOWED_ORIGIN` | Backend | If set, restricts CORS to this origin only. |

