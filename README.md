# GreenPearl: Premium Private Multiplayer Party Games Platform

A modern, functional, responsive, private party-games web application built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Socket.IO**, and **Prisma ORM**.

Designed specifically for groups of close friends with a minimal, dark, focused aesthetic (charcoal, near-black, and restrained purple/lavender/blue accents).

---

## 🎮 Modes of Play

The platform separates the core game rules engine from the connection layer, providing three distinct gameplay experiences:

1. **Pass the Phone (100% Offline Local Mode)**
   - Sit together in the same room sharing one smartphone or tablet.
   - Requires **no login, no room code, and no internet connection**.
   - Features **Pass-the-Phone privacy cover shields** ("Pass phone to [Name]" -> "I am [Name] - Tap to Reveal") to keep secret words and roles completely hidden from the next player.

2. **Online Multiplayer (Individual Devices)**
   - Friends join from their own mobile phones or desktop browsers.
   - Private 6-character room codes (`ABC123`) and one-click shareable invitation links.
   - Server-authoritative state, real-time WebSocket timers, synchronized bidding, and simultaneous reveals.

3. **Hybrid Mode (Shared Couch + Remote Friends)**
   - Multiple friends sharing a physical device alongside remote friends joined via invite links.
   - Device passes turns locally when required while keeping remote players synchronized in real-time.

---

## 🎲 Included Game Modes

### 1. Imposter (Social Deduction)
- Innocents receive the same secret word; one player is randomly designated as the **Imposter** (who receives no word).
- Clue-giving rounds with strict turn order, open discussion timer, and private voting.
- **Security Guarantee**: The server strips the secret word from all network payloads sent to the imposter.
- **Imposter Final Guess**: If the imposter is identified, they receive one shot to type and guess the secret word. If correct, the imposter wins!

### 2. Forehead Frenzy (Fast-Paced Forehead Guessing)
- Player holds the device against their forehead facing friends.
- Friends shout clues and act out prompts against the clock.
- **Controls**:
  - **Tilt Down**: Correct answer (+1 pt, +2 for hard words).
  - **Tilt Up**: Skip word (within configurable pass limits).
  - **Touch Fallback**: Oversized touch controls for phones or laptops without gyro sensors.
- Timers: 30s, 60s, 90s, or 120s. Distance-readable high-contrast typography.

### 3. Auction Draft (Competitive Team Building)
- Real-time synchronized bidding on **Football Superstars** or **Clash Royale Cards**.
- Budget limits enforced server-side: prevents overbidding and enforces reserve credits for remaining squad slots.
- **Deterministic Team Evaluation Engine**:
  - Evaluates completed teams using structured data (overall ratings, position coverage [GK, DEF, MID, FWD], tactical attack vs. defense balance, club/league/national chemistry, and budget value-for-money).
  - For Clash Royale: evaluates average Elixir curve, win-condition presence, air-defense coverage, and spell versatility.
  - Produces an algorithmic rating (0–100), Tier (S/A/B/C/D), pros, cons, and tactical critique.

### 4. Additional Party Modes
- **Dumb Charades**: Silent acting prompts with movie/dialogue categories.
- **Taboo**: Target word with 5 forbidden words and a live buzzer.
- **Pictionary**: Real-time synchronized HTML5 digital canvas.
- **Majority Rules**: Subjective group polls with points awarded to the majority consensus.
- **Who's Most Likely To**: Group accusations and simultaneous vote reveals.
- **Rapid Fire**: Quick category naming against a 30-second countdown.
- **Hot Seat & Two Truths and a Lie**: Social interrogations and deception detection.

---

## 📚 Content Library (2,000+ Curated Entries)

The platform includes a substantial, recognizable, duplicate-free content library:

| Category | Size | Region / Scope |
|---|---|---|
| **Football Players** | 310 | Global superstars & Indian stars (ratings, positions, stats) |
| **Football Clubs** | 129 | Premier League, La Liga, Serie A, Champions League, ISL |
| **Clash Royale Cards** | 103 | Complete official collection (Elixir, rarity, card type, target) |
| **Bollywood Movies** | 224 | Classics, modern hits, blockbusters, comedies |
| **Bollywood Actors** | 130 | Iconic leading men & character actors |
| **Bollywood Actresses** | 110 | Leading ladies of Hindi cinema |
| **Hindi Songs** | 207 | Romantic anthems, party tracks, chartbusters |
| **Punjabi Songs** | 155 | Desi hip-hop, high-energy pop, folk |
| **Cricket Players** | 170 | Indian icons & international legends |
| **Food & Dishes** | 110 | North Indian specialties, street food, global cuisine |
| **Fruits & Vegetables** | 70 | Desi and exotic produce |
| **Cities & Destinations**| 115 | Indian cities, hill stations, global capitals |
| **Anime & Video Games** | 100 | Shonen anime characters & video game titles |
| **TV & Web Shows** | 95 | Indian web series, classic serials, international hits |
| **Cars & Brands** | 70 | Supercars, Indian SUVs, worldwide brands |
| **Taboo Cards** | 40 | Target words with 5 forbidden words each |
| **Party Prompts** | 50+ | Prompts for Majority Rules, Who's Most Likely To, Hot Seat |

Explore, search, validate, and add custom entries in the in-app **Content Library** (`/datasets`).

---

## 🛠️ Architecture & Technology Stack

```
greenpearl/
├── prisma/
│   └── schema.prisma         # Prisma ORM schema (SQLite local, PostgreSQL prod)
├── scripts/
│   ├── buildDatasets.js      # Seed dataset generation script
│   ├── buildMoreDatasets.js  # Extended dataset generation
│   └── runTests.ts           # Automated test suite (37 tests across 15 criteria)
├── src/
│   ├── app/                  # Next.js App Router (layout, home, create, join, room, local, datasets)
│   ├── components/
│   │   ├── common/           # Navbar, Scoreboard, PassPhonePrivacyCover, TurnBanner
│   │   ├── games/            # Imposter, Forehead, Auction, Charades, Taboo, Pictionary
│   │   └── ui/               # Button, Input, Card, Badge, Modal
│   ├── lib/
│   │   ├── adapters/         # LocalAdapter, OnlineAdapter, HybridAdapter
│   │   ├── datasets/         # DatasetManager, duplicate detector, seed JSON files
│   │   ├── engine/           # Pure game rules (Imposter, Forehead, Auction, Turns)
│   │   ├── evaluation/       # Deterministic Football & Clash Royale team evaluators
│   │   └── types/            # TypeScript interfaces (room, game, socket)
│   └── server/
│       ├── roomManager.ts    # Authoritative in-memory room store & masking
│       └── socketHandler.ts  # Typed Socket.IO event listeners & Zod validation
├── server.ts                 # Unified Node.js server mounting Next.js + Socket.IO
└── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/greenpearl.git
cd greenpearl

# 2. Install dependencies
npm install

# 3. Initialize Database
npx prisma db push

# 4. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the test suite verifying all 15 acceptance criteria:

```bash
npx tsx scripts/runTests.ts
```

Output:
```
=== RESULTS: 37 PASSED, 0 FAILED ===
```

---

## 🌐 Production Deployment Guide

### Deploying on a Virtual Private Server (VPS / DigitalOcean / EC2 / Linode)

Because real-time multiplayer requires persistent WebSocket connections, run the custom Node.js server:

1. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Set:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/greenpearl?schema=public"
   PORT=3000
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

3. **Process Management with PM2**:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "greenpearl"
   pm2 save
   ```

4. **Nginx Reverse Proxy with WebSocket Upgrades**:
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       listen 443 ssl;
       # SSL certbot configurations
   }
   ```

---

## 🔒 Security & Fair Play Highlights

- **Zero Information Leakage**: The server calculates masked states per-player. Imposters never receive the secret word over WebSockets or in client DOM state.
- **Budget Integrity**: The server validates all auction bids, enforcing minimum raises and slot reserve calculations.
- **Authoritative Clock**: Turn timers run server-side to prevent client clock tampering.
- **Safe Reconnection**: Reconnecting players reclaim their active seat and role without restarting games.

