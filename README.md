<img width="1280" height="640" alt="KKU - Kothuk Kudumba Unit" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# [KKU - Kothuk Kudumba Unit] 🎯

> **“The digital home for every mosquito — saving blood for a rainy day.”**

---

## Basic Details
### Team Name: `200 ok`

### Team Members
- **Member 1:** [SREERAG A.S] - [Institute of Engineering and Technology Kohinoor Calicut University]
- **Member 2:** [Eswal Narayanan] - [Institute of Engineering and Technology Kohinoor Calicut University]

---

### Project Description
**KKU (Kothuk Kudumba Unit)** is an autonomous, full-stack digital government and civil society platform designed exclusively for the mosquito civilization. It organizes millions of citizen mosquitoes into a structured society featuring digital citizen identities, real-time population telemetry, tactical bite vacancy mapping with live sirens, emergency trauma hospital care, governmental pensions, saliva recharge dispensaries, and an in-world blood banking resource economy.

The platform simulates dynamic swarm life with autonomous backend ticks, Groq Llama-3 AI narrative generators, and SQLite3 persistence.

---

### The Problem (that doesn't exist)
Mosquitoes have been working tirelessly for over 100 million years annoying humans at 3 AM and dodging rolled-up newspapers, ceiling fans, and 3000V electric rackets. Yet, they have never had:
- A centralized governmental welfare portal
- Official digital citizen passports
- Emergency proboscis trauma healthcare or maternity leave support
- Retirement pension funds and war injury recognition
- Tactical radar maps to coordinate high-yield biting missions
- A central blood reserve bank to save blood for a rainy day

---

### The Solution (that nobody asked for)
We built the world's first complete digital mosquito civilization platform.

Our platform equips every citizen mosquito with:
- **Unique KKU-ID & Mosquito Passport**: Verified digital citizenship with species classification, wing condition, and 3 AM buzz frequency tuning.
- **Live Command Center & Population Telemetry**: Real-time population ticker with mechanical rolling odometers, birth/death simulation, and AI civilian dispatches.
- **Tactical Bite Vacancies Radar**: Dynamic Leaflet maps featuring iPhone Dynamic-Island style pins, auto-filling vacancies, and synthesized audio sirens.
- **🏥 MOSQ-HOSPITAL**: 5-patient emergency trauma wing, ICU proboscis care, and maternity leave egg-maturation suites with continuous notification sirens.
- **🩸 MOSQ-BANK**: A central blood reserve system managing four specialized reserve vaults (Emergency, Pension, Community, Veteran) with JWT-authenticated donations and top donor leaderboards.
- **🏛️ MOSQ-PENSION**: Autonomous retirement & disability payouts, war injury allocations, and life history verification.
- **🧪 MOSQ-RECHARGE™**: Saliva reserve dispensaries with live decay telemetry and nectar hydration stations.
- **🏆 Biter Hall of Fame Leaderboard**: Live competitive civic rankings for top night biters.

*Basically, we gave mosquitoes everything a modern democratic society needs — except voting rights.*

---

## Technical Details

### Technologies/Components Used

#### For Software:
- **Languages:** JavaScript (ES6+), TypeScript, SQL, HTML5, CSS3
- **Frontend Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), Vanilla CSS Design Tokens, [Lucide React](https://lucide.dev/) Icons
- **Mapping & Audio:** [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/), Web Audio API (Synthesized Siren Engine)
- **Backend Framework:** [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database:** [SQLite3](https://www.sqlite.org/) (Single source of truth with atomic transactions)
- **Authentication & Security:** JSON Web Tokens (JWT), `bcryptjs` password hashing
- **Artificial Intelligence:** [Groq Cloud API](https://groq.com/) (`llama-3.3-70b-versatile`) with local heuristic failover
- **Tools & Hosting:** VS Code, Git, GitHub, TinkerHub, Vercel

#### For Hardware:
- *None (Purely simulated software ecosystem running on modern web browsers and Node runtime).*

---

### Implementation

The project is structured into distinct, interconnected modules of the mosquito civilization:

1. **Citizen Authentication & Passport Badge (`/`)**
   - Mosquito ID-based register and login system using JWT.
   - Profile popover card featuring blood preference (*O-Negative Sweet & Warm*), lifespan countdown, swatter agility rating, and live editable biography.

2. **Command Center & Telemetry (`/dashboard`)**
   - Autonomous population ticker updating births and deaths every 5 seconds.
   - Dual-stat cards, live system status bar, and real-time Groq AI citizen dispatches.

3. **Bite Vacancies & Tactical Radar (`/bite-vacancies`)**
   - Real-world interactive Leaflet map of high-demand human targets.
   - iPhone Dynamic-Island style map status pills anchored with downward pointers.
   - Dynamic 5-second auto-filling algorithm that cycles filled targets and triggers synthesized web audio sirens on urgent spawns.

4. **MOSQ-HOSPITAL (`/hospital`)**
   - 5 active inpatient trauma cases (e.g., *Swat Newspaper Trauma*, *3000V Tennis Racket Singes*, *Maternity Leave*).
   - 3-at-a-time continuous rotating dispatch carousel with manual batch controls.
   - Real-time clinical blood reserve tank with direct linkage to MOSQ-BANK.

5. **MOSQ-BANK (`/bank`)**
   - Dedicated blood banking dashboard with total stored volume (e.g., 2,847 mL).
   - Four reserve categories: 🚑 Emergency (1,200 mL), 👴 Pension (847 mL), 🦟 Community (800 mL), and 🏅 Veteran (0 mL).
   - Interactive Community Blood Donation form with instant SQLite ledger update.
   - Hall of Benefactors (Top Donors Leaderboard) and audit trail table.
   - Dynamic shortage detection and civic donation drives.

6. **MOSQ-PENSION (`/pension`)**
   - Automated retirement eligibility calculation (age ≥ 14 days or health < 40%).
   - Monthly pension payouts debiting the bank's Pension Reserve.

7. **MOSQ-RECHARGE™ (`/recharge`)**
   - Real-time saliva reserve management (10.0 nL max, decaying 0.1 nL per tick).
   - One-click nectar infusion dispensary.

8. **Leaderboard (`/leaderboard`)**
   - Ranked leaderboard tracking biting counts, saliva reserves, and career badges.

---

## Architecture & Data Flow

```
                               ┌────────────────────────────────┐
                               │       SQLite3 (kku.db)         │
                               │  Single Unified Source of Truth│
                               └───────────────┬────────────────┘
                                               │
                                               │ (Atomic Transactions)
                                               ▼
                               ┌────────────────────────────────┐
                               │     Express API Backend        │
                               │    (Node.js / Port 5000)       │
                               └───────┬───────────────┬────────┘
                                       │               │
                     (REST Endpoints & JWT)    (Groq AI Event Engine)
                                       │               │
                                       ▼               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Next.js 16 (Port 3000)                                 │
│                                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ /dashboard   │  │ /hospital    │  │ /bank        │  │ /pension     │  │ /recharge│  │
│  │ Telemetry &  │  │ 5 Patients & │  │ 4 Reserves & │  │ Retirement & │  │ Saliva   │  │
│  │ Population   │  │ Siren Dispatc│  │ Blood Donat. │  │ Disability   │  │ Nectar   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │
│                                                                                        │
│  ┌───────────────────────────────┐     ┌────────────────────────────────────────────┐  │
│  │ /bite-vacancies               │     │ /leaderboard                               │  │
│  │ Leaflet Map & Island Pills    │     │ Top Biters Hall of Fame                    │  │
│  └───────────────────────────────┘     └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm` or `pnpm`

### 2. Clone the Repository
```bash
git clone https://github.com/eswal144/KKU-kothuk-kudumba-unit.git
cd KKU-kothuk-kudumba-unit
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies
```bash
cd ../kku
npm install
```

---

## Run

### 1. Start the Backend API Server
```bash
cd backend
npm start
```
*The backend API server and automated simulation engine will start on `http://localhost:5000`.*

### 2. Start the Frontend Next.js Application
Open a second terminal window:
```bash
cd kku
npm run dev
```
*The web application will be accessible at `http://localhost:3000`.*

---

## Project Documentation

### Screenshots

#### 1. Command Center & Population Telemetry
![Command Center Dashboard](https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd)
*The central dashboard featuring real-time population odometers, citizen dispatches, and the Mosquito Passport.*

#### 2. MOSQ-BANK: Central Blood Reserve & Donation System
![MOSQ-BANK Dashboard](https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd)
*The MOSQ-BANK interface displaying the 4 reserve vaults (Emergency, Pension, Community, Veteran), shortage drives, and donation leaderboard.*

#### 3. MOSQ-HOSPITAL & Clinical Healthcare
![MOSQ-HOSPITAL](https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd)
*Inpatient clinical wing managing emergency trauma, ICU proboscis care, maternity suites, and rotating alert sirens.*

---

### Project Demo

#### Video
- **Demo Video:** `[Add Demo Video Link Here]`
*Walkthrough of the mosquito registration, live map bite mission claiming, emergency hospital admissions, and blood bank donation flow.*

---

## Team Contributions
- **SREERAG A.S:** Full-stack architecture, Next.js frontend UI/UX design, Leaflet radar map with iPhone Dynamic Island pills, audio siren synthesis, Express backend & SQLite3 schema, Groq AI narrative engine integration, and dashboard integration.
- **Eswal Narayanan:** MOSQ-BANK and MOSQ-PENSION integration, authentication & JWT middleware, simulation loop engineering, documentation, API stress testing, and deployment.

---

Made with ❤️ at **TinkerHub Useless Projects 3.0**

[![TinkerHub](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)](https://www.tinkerhub.org/)
[![UselessProjects-26](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)](https://tinkerhub.org/events/1M8ORET9A1/useless-projects-3.0)
