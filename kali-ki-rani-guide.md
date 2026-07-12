# Kali Ki Rani (Queen of Spades) — Development & Deployment Guide

A 4-player partnership trick-taking bidding game, built as a real-time PWA.

**Stack:** React + Vite (PWA) frontend · Node.js + Socket.io (server-authoritative) backend · in-memory per-room state

---

## Table of Contents

1. [Game Rules](#1-game-rules)
2. [Edge Cases — Quick Reference](#2-edge-cases--quick-reference)
3. [Open Configuration Items](#3-open-configuration-items)
4. [Architecture](#4-architecture)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Deployment Guide](#6-deployment-guide)

---

## 1. Game Rules

### 1.1 Setup & Dealing

- Fixed 4 players, standard 52-card deck, no jokers.
- All 52 cards dealt equally: 13 per player.
- **Point cards** (150 points total in the deck):
  | Card | Points | Count | Subtotal |
  |---|---|---|---|
  | Queen of Spades | 30 | 1 | 30 |
  | Aces | 15 | 4 | 60 |
  | 10s | 10 | 4 | 40 |
  | 5s | 5 | 4 | 20 |
  | All other cards | 0 | 36 | 0 |
  | **Total** | | **52** | **150** |
- **Bid-starter rotation:** the player who opens bidding rotates every hand — the next hand's bid-starter is the player immediately clockwise from the previous hand's bid-starter. There is **no separate dealer role**; the bid-starter rotation fully replaces it.

### 1.2 Bidding Phase

- The bid-starter **must** open the bidding — they cannot pass. Opening bid must be between **75 and 150 (inclusive)**, in multiples of 5.
- Play proceeds clockwise. Each subsequent player may either:
  - Raise the current bid by 5 or a multiple of 5, or
  - **Pass**
- Once a player passes, they are **locked out of bidding for the rest of that hand** — they cannot re-enter even if bidding comes back around to them.
- If the bid reaches the maximum of **150**, the only legal action for the next player is to pass (no higher bid is possible).
- Bidding ends when only one player remains (everyone else has passed). That player is the **bid winner**.

### 1.3 Partner & Trump Declaration

The bid winner declares, in this order:

1. **Partner's card** — e.g. "My partner holds the Ace of Spades." This names any card in the deck; the player currently holding it becomes the bid winner's secret partner.
2. **Trump suit** — e.g. "Spades is trump."

**Critical rule:** Partnership is completely hidden — **not even the bid winner knows who their partner is** — until the named card is actually played during a trick. If the bid winner happens to name a card that is in their own hand, this incidentally makes it a **solo bid (1 vs 3)**. There is no separate "going solo" declaration; it's simply a consequence of which card gets named.

### 1.4 Trick-Taking Phase

- The bid winner leads the first trick. Turn order proceeds clockwise.
- **Mandatory follow-suit:** if a player holds a card of the led suit, they must play that suit — no other suit may be played instead.
- **If void in the led suit**, a player may play:
  - A trump card (potentially winning the trick), or
  - Any other off-suit card as a discard — including feeding point-cards to their partner, if partnership is already known (i.e., the partner's named card has already been played).
- **Trump can be led at any time**, including on trick 1 — there is no "breaking trump" requirement.
- There is no rule restricting when the Queen of Spades (or any card) can be led. Timing point-card releases is a matter of strategy, not a rule.
- **Trick resolution:**
  - If any trump was played in the trick, the highest trump wins.
  - If no trump was played, the highest card of the led suit wins (cards not in the led suit and not trump cannot win, regardless of rank).
- The trick winner collects all point-cards contained in that trick; those points are added to their team's running total for the hand. The trick winner leads the next trick.

### 1.5 Early Hand Resolution

A hand can end **before all 13 tricks are played**, in either of these cases:

- **Bid secured:** the bidding side's captured points reach the bid value (success is guaranteed; no further tricks change the outcome).
- **Bid mathematically dead:** the opponents' captured points reach `150 − bid value + 5` (the bidding side can no longer reach their bid value even if they won every remaining point card).

When either threshold is crossed, the **trick currently in progress is finished first**, then the hand stops immediately and scoring proceeds — the remaining cards are not played out.

### 1.6 Scoring

- **Success condition:** capturing points **at least equal to** the bid value counts as success (exceeding the bid still counts as success, scored the same as an exact hit — there's no separate overtrick bonus).

| Scenario | Bid Winner | Partner | Opponents |
|---|---|---|---|
| Partnership bid — **success** | 2× bid value | 1× bid value | 0 each |
| Partnership bid — **failure** | 0 | 0 | Full bid value **each** (not split) |
| Solo bid (1v3) — **success** | 3× bid value | — | 0 each |
| Solo bid (1v3) — **failure** | 0 | — | Full bid value **each** (not split) |

- Scores are tracked **per individual player**, cumulative across hands (not per fixed team, since partnerships reshuffle every hand based on who gets named).
- Scores can never go negative — floored at 0. (Note: under the current scoring model, no rule ever subtracts points from a player, so this floor is a safety net rather than an actively-triggered mechanic.)
- **Match end:** the match ends the instant any single player's cumulative score reaches or exceeds **1000**. The player with the highest score at that point wins the match.

### 1.7 Turn Timing & Disconnects

- If a player doesn't act (bid or play a card) within the configured time limit, the system automatically acts on their behalf: **auto-pass** during bidding, **auto-play a legal card** during trick-play.
- If a player disconnects mid-hand, the game does **not** pause — it applies the same auto-act behavior so the other three players aren't blocked waiting.

---

## 2. Edge Cases — Quick Reference

| # | Scenario | Resolution |
|---|---|---|
| 1 | First bidder wants to pass | Not allowed — the bid-starter must open the bidding |
| 2 | All-pass scenario | Not applicable — since the bid-starter can't pass, at least one bid always exists |
| 3 | Player passes, bidding returns to them | They stay locked out for the rest of the hand |
| 4 | Bid hits 150 | Only "pass" is legal for the next player |
| 5 | Bid winner names their own card | Incidental solo bid — no separate declaration, engine treats it as 1v3 |
| 6 | Declaration order | Partner card is named first, then trump suit |
| 7 | Partnership visibility | Hidden from **everyone including the bid winner** until the named card is played |
| 8 | Led suit is trump, player is void | Can discard any card freely, including a point card to feed a known partner |
| 9 | No trump played in a trick | Highest card of the led suit wins |
| 10 | Leading trump | Allowed at any time, including trick 1 — no "breaking" requirement |
| 11 | Leading Queen of Spades | No rule restriction — timing is player strategy only |
| 12 | Bid met exactly vs. exceeded | Both count as success, scored identically |
| 13 | Bid exactly failed (1 point short) | Full failure — bid winner and partner score 0, opponents score full bid value each |
| 14 | Trick point collection | Trick winner takes all point-cards in that trick; team total = sum across won tricks |
| 15 | Hand ends early | Finish the trick in progress, then stop and score immediately |
| 16 | Dealer role | Doesn't exist separately — bid-starter rotation replaces it |
| 17 | Player times out on their turn | Auto-pass (bidding) or auto-play a legal card (trick-play) |
| 18 | Player disconnects mid-hand | Auto-act on their behalf; game does not pause |
| 19 | Match scoring basis | Per-individual-player cumulative score, not per fixed team |
| 20 | Match end | First player to reach/exceed 1000 cumulative points; highest score wins |

---

## 3. Open Configuration Items

These are implementation-level decisions, not core gameplay ambiguities — they need a value before the timeout/bot logic can be built, but don't change the rules above:

- **Seating order for hand 1 of a match:** how is the very first bid-starter chosen (random draw, host-selects, fixed seat)?
- **Timeout duration:** how many seconds before auto-pass/auto-play triggers?
- **Auto-play card selection:** when a timed-out player must auto-play a trick, what card does the system choose — lowest legal card, random legal card, or something bid-aware?

---

## 4. Architecture

- **Backend:** Node.js + Socket.io, server-authoritative — the server is the single source of truth, which is essential for the hidden-partner mechanic (the server itself doesn't "know" partner identity any earlier than the players do — partnership is only resolved and revealed at the moment the named card is played).
- **Frontend:** React + Vite, packaged as a PWA via `vite-plugin-pwa`.
- **State:** in-memory, per-room. No persistent database in the initial build.
- **Engine:** framework-free, pure-logic modules (`constants.js`, `deck.js`, `bidding.js`, `trick.js`, `game.js`) — fully decoupled from networking and UI so the rules can be unit-tested independently of Socket.io or React.

---

## 5. Implementation Roadmap

1. **Rules finalization** ✅ — this document.
2. **Core game engine** ✅ — scaffolded as pure logic (deck, bidding, trick, game state).
3. **Automated engine tests** — cover every edge case in Section 2 as a discrete test, especially: solo-bid detection, early hand resolution thresholds, follow-suit enforcement, and partner-reveal timing.
4. **Socket.io networking layer** — room management, server-authoritative move validation, reconnect/auto-act handling per Section 1.7.
5. **PWA frontend** — React UI, bidding interface, trick-play interface, service worker + manifest via `vite-plugin-pwa`.
6. **Computer players (ML bots)** — a later phase, layered on top of the finished engine:
   - Start with a rules-based bot (legal-move + simple heuristic play) to unblock 1–3 player testing without needing 4 humans.
   - Layer in a learning component afterward (e.g. self-play reinforcement learning against the rules-based bot or itself) once the engine and enough real game logs exist to train against.
   - Because the engine is pure and framework-free, bots can be developed and tested entirely against engine state, independent of the networking/UI layers.

---

## 6. Deployment Guide

**Chosen platforms:** Render (free web service) for the backend, Cloudflare Pages (free) for the frontend. Both are free with no credit card and no ads.

### 6.1 Why this combination

| Requirement | Why it matters | How it's met |
|---|---|---|
| Long-lived process | Socket.io needs persistent WebSocket connections, not serverless functions | Render web services run a real Node process |
| No credit card / no ads | Explicit requirement | Neither platform requires a card or shows ads |
| Global static delivery | PWA assets should load fast everywhere | Cloudflare's CDN free tier is generous |
| In-memory state tolerance | Rooms live in server memory only | Fine — state loss only happens when idle, i.e. no active game to lose |

**Trade-off accepted:** Render's free web service spins down after 15 minutes with no inbound traffic, causing a ~1 minute cold start on the next connection. Acceptable for a casual game; a "waking up the server…" UI message covers it.

### 6.2 Backend on Render

1. Push server code (Socket.io + engine files) to GitHub, in its own directory or repo.
2. Render: **New → Web Service → connect repo.**
3. Settings: Build command `npm install`, start command `node index.js`, instance type **Free**.
4. Environment variables:
   ```
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-app.pages.dev
   ```
5. Bind to Render's assigned port:
   ```js
   const PORT = process.env.PORT || 3001;
   server.listen(PORT);
   ```
6. Restrict Socket.io CORS to your frontend origin only:
   ```js
   const io = new Server(server, {
     cors: { origin: process.env.CLIENT_ORIGIN, methods: ["GET", "POST"] }
   });
   ```

### 6.3 Frontend on Cloudflare Pages

1. Cloudflare dashboard: **Workers & Pages → Create → Pages → connect to Git.**
2. Settings: Framework preset **Vite**, build command `npm run build`, output directory `dist`.
3. Environment variable:
   ```
   VITE_SERVER_URL=https://your-backend.onrender.com
   ```
4. Client connection:
   ```js
   const socket = io(import.meta.env.VITE_SERVER_URL, { transports: ["websocket"] });
   ```
5. `vite-plugin-pwa`: use `registerType: 'autoUpdate'` and hook `onNeedRefresh` to prompt returning players to refresh after a new deploy.

### 6.4 Deployment Rules

1. Never hardcode the server URL or port — always read from environment variables.
2. Restrict Socket.io CORS to the actual frontend origin — never `origin: "*"` in production.
3. Treat Render's free instance as ephemeral — no reliance on local disk writes; use an external free-tier DB later if persistence is needed.
4. Design client reconnect logic to detect "room no longer exists" (post spin-down) and return players to a lobby gracefully.
5. Tag releases in Git so a bad deploy can be rolled back quickly from Render's dashboard.

### 6.5 Deployment Edge Cases

**Backend / Render**
- Cold start on first connect after idle — show a "waking up the server" state client-side.
- Mid-game spin-down risk — Socket.io's built-in ping/pong (~25s interval) counts as traffic, so an active game should keep the instance warm; only a genuinely idle table risks spin-down.
- Deploys mid-match drop all active connections/rooms — schedule deploys for low-traffic windows if pushing frequently.
- Free tier is a single instance — fine for now, but a future paid multi-instance upgrade would need sticky sessions or shared state (e.g. Redis) for Socket.io.

**Frontend / PWA**
- Stale service worker cache — use the `onNeedRefresh` prompt so players aren't stuck on an old build.
- Mixed content — both ends must be HTTPS/WSS (both platforms provide this by default).
- iOS PWA install quirks — test "Add to Home Screen" specifically on iOS Safari if cross-platform install matters.

**Game-logic specific**
- Reconnect during the hidden-partner phase — the server must resend only what a reconnecting player is entitled to know: their own hand, and partner identity only if the named card has already been played.
- Room cleanup — periodically sweep and delete rooms with no connected sockets, so memory doesn't slowly fill between spin-downs.

### 6.6 Pre-Launch Checklist

- [ ] Server reads `PORT` from `process.env`
- [ ] Socket.io CORS locked to the Cloudflare Pages origin
- [ ] Client reads server URL from `VITE_SERVER_URL`
- [ ] `vite-plugin-pwa` configured with `autoUpdate` + update-available prompt
- [ ] Client shows a "waking up server" state during cold starts
- [ ] Room cleanup sweep implemented server-side
- [ ] Reconnect logic tested for all 4 seats, including the hidden-partner case
- [ ] Timeout/auto-act logic implemented per Section 1.7
- [ ] Engine unit tests cover every row in Section 2
- [ ] No secrets committed to the repo — all config via environment variables
