# 🚀 KKU Full-Stack Deployment Guide (Render)

This step-by-step guide explains how to deploy the **KKU (Kothuk Kudumba Unit)** project on [Render](https://render.com).

---

## 🏗 Project Architecture Overview

| Component | Technology | Directory | Render Service Type |
| :--- | :--- | :--- | :--- |
| **Backend API** | Node.js / Express / SQLite3 / Groq AI | `backend/` | **Web Service** |
| **Frontend UI** | Next.js 16 / React 19 / Tailwind / Leaflet | `kku/` | **Web Service** (or Vercel) |

---

## 📋 Prerequisites

1. A **GitHub account** with the KKU repository pushed: [`eswal144/KKU-kothuk-kudumba-unit`](https://github.com/eswal144/KKU-kothuk-kudumba-unit).
2. A free account on [Render.com](https://dashboard.render.com).
3. (Optional) Your **Groq API Key** for AI Civilization news & simulations.

---

## 🟢 Part 1: Deploy the Backend (Node.js API)

### Step 1: Create a New Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right corner and choose **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repo: `eswal144/KKU-kothuk-kudumba-unit`.

---

### Step 2: Configure Backend Settings
Fill in the configuration fields with the following exact values:

| Field | Value |
| :--- | :--- |
| **Name** | `kku-backend` (or any name you choose) |
| **Region** | Singapore / Frankfurt / Oregon (choose closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` *(Crucial!)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

---

### Step 3: Add Backend Environment Variables
Scroll down to the **Environment Variables** section and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Render default web service port |
| `JWT_SECRET` | `kku_super_secret_jwt_key_2026` | Any secure random string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `DB_PATH` | `./kku.db` | SQLite database file location |
| `GROQ_API_KEY` | *(Your Groq API key)* | Optional for AI civilization engine |
| `KKU_POPULATION_TICK_MS` | `5000` | AI simulation tick interval |
| `KKU_SALIVA_TICK_MS` | `10000` | Saliva decay interval |
| `KKU_MIN_BIRTHS_PER_TICK` | `0` | Min births per tick |
| `KKU_MAX_BIRTHS_PER_TICK` | `5` | Max births per tick |
| `KKU_MIN_DEATHS_PER_TICK` | `0` | Min deaths per tick |
| `KKU_MAX_DEATHS_PER_TICK` | `3` | Max deaths per tick |
| `KKU_SALIVA_DECAY_NL` | `0.1` | Decay per tick |
| `KKU_AI_BATCH_SIZE` | `20` | Batch size |
| `KKU_AI_LOW_QUEUE_THRESHOLD` | `5` | Low queue threshold |

---

### Step 4: Deploy & Copy Your Backend URL
1. Click **Create Web Service**.
2. Render will build and start your backend. Wait until the status changes to **Live** (green).
3. Copy your live backend URL from the top of the page (e.g. `https://kku-backend.onrender.com`).
4. Test it by opening `https://your-backend-url.onrender.com/` in your browser. You should see the KKU JSON status response.

---

## 🔵 Part 2: Deploy the Frontend (Next.js)

You can deploy the frontend on **Render** or on **Vercel** (both work great).

### Option A: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Select the same repository `eswal144/KKU-kothuk-kudumba-unit`.
4. Configure with:
   - **Name**: `kku-frontend`
   - **Root Directory**: `kku` *(Crucial!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api` *(Paste your actual Backend URL from Part 1 with `/api` at the end)*
6. Click **Create Web Service**.

---

### Option B: Deploy on Vercel (Recommended for Next.js)

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import the `eswal144/KKU-kothuk-kudumba-unit` repository.
3. In **Root Directory**, click *Edit* and select the `kku` folder.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api`
5. Click **Deploy**.

---

## 🔄 Part 3: Verification Checklist

Once both services are deployed:

- [ ] **Backend Status**: Visit `https://your-backend-url.onrender.com/` ➔ Confirm JSON status is `"online"`.
- [ ] **Frontend Landing Page**: Visit your frontend URL ➔ Confirm the hero page, logo, and animations load.
- [ ] **Mosquito Registration / Login**: Click login / register on the top right to verify authentication.
- [ ] **Real-time MOSQ-BANK & Hospital**: Navigate to `/bank` and `/hospital` to verify live synced blood reserves.
- [ ] **GIS Map**: Open `/bite-vacancies` to confirm tactical tile layers and bite alerts.

---

## 💡 Troubleshooting & Notes

- **Render Free Tier Spin-down**: On Render's free tier, the backend web service spins down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to wake up.
- **SQLite Persistence**: On the free tier of Render, SQLite database updates are stored in ephemeral storage and reset when the instance restarts. If you need permanent persistence across restarts, you can attach a **Render Disk** or use a hosted PostgreSQL database.
