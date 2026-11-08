# Planet Miner: Game Design Document

Version 0.1 (draft) · 2026-11-08 · Owner: Tim

Items marked **OPEN** need a decision from Tim. Items marked **PROPOSED** are default suggestions that can be changed.

---

## 1. Overview

**Pitch:** Command a mothership, buy planets, mine them with a fleet of upgradeable ships, craft goods, and build a trade empire across the stars.

**Genre:** Space management and trading game with idle/incremental elements.

**Platform:** Desktop and mobile web browsers are **both first-class** (decided, Tim 2026-11-08). Every screen must work with mouse and keyboard and with touch, in landscape and portrait.
- UI scales from phone width (~360px) up to large desktop monitors
- Tap targets at least 44px; no hover-only interactions
- Short sessions on a phone (collect, sell, queue crafting) must be just as easy as long sessions on desktop
- Same account and cloud save across devices
- Installable as a PWA (add to home screen) is a PROPOSED extra

**Audience:** **OPEN.** Casual players who like progression and trading games (e.g. a 15 to 30 minute session), or deeper strategy players who play for hours?

**Session style:** **PROPOSED.** Active play (flying, deploying, crafting) plus offline progress, so mining ships keep working for a capped time while the player is away.

**Single-player or multiplayer:** **Multiplayer, shared galaxy** (decided by implication, Tim 2026-11-08: players can attack each other and collect bounties, see §10A). Players share one galaxy, can meet, fight, and hunt wanted players.
- **OPEN.** Is it one big shared galaxy, or several servers/shards?
- **OPEN.** Can players also trade with each other directly?

## 2. Story and setting

### 2.1 Decided (Tim, 2026-11-08)

- **Tone:** light-hearted, funny sci-fi. Jokes and charm over deep lore. Think silly bureaucracy, quirky characters, and comic item descriptions rather than grim space drama.
- **The galaxy:** every planet belongs to **the Kingdom**. Nobody mines for free: you pay the Kingdom for the right to mine a planet. That is why planets must be bought before you can deploy ships.
- **The player:** a **former prisoner** who was sent out to mine to earn their way out. They start with almost nothing and are in it for money and to gain things (better ships, more planets, freedom, status).
- **Motivation:** get rich, collect stuff, climb from convict to tycoon.

### 2.2 Still open

- **Decided:** the player starts on a "work release" deal, owing the Kingdom a huge debt. The early goal is to **pay off the debt**. Paying it off ends Act 1.
- Players can fall back into trouble: attacking innocent players makes you **wanted** and earns a fine (see §10A).
- **Decided:** the Kingdom's ruler is a **funny recurring character** who shows up in story scenes, announcements, fines and loading-screen decrees.
- **OPEN.** Which ruler? Ideas to pick from or riff on:
  - A tiny, very self-important king who insists on being called "Your Enormousness"
  - A queen who is clearly a cat, and nobody in the Kingdom will admit it
  - A malfunctioning royal robot that issues ridiculous decrees ("All asteroids must now be polished")
  - A royal accountant who runs everything and loves fining people a little too much
- **OPEN.** Is there a rival? (e.g. another ex-prisoner, a smug noble mining company, a Kingdom tax collector who keeps showing up)
- **OPEN.** What happens after the debt is paid: does the game end, or does the player keep building an empire (maybe even buying influence in the Kingdom)?
- **OPEN.** Names: the player's mothership, the Kingdom, the starting star system, the prison.

**PROPOSED structure:** the story is told in chapters, each unlocked by reaching a progression milestone (for example, owning your first three planets, or completing a big contract). Story is delivered through short dialogue scenes with characters on planets and the mothership crew.

## 3. Core gameplay loop

```
Travel to system → Buy planet → Deploy mining ships → Collect resources
       ↑                                                      ↓
  Expand / upgrade  ←  Earn credits & reputation  ←  Craft → Sell / supply planets
```

**Moment to moment:** manage the fleet, collect cargo, queue crafting, check planet markets.
**Session to session:** buy new planets, unlock new systems, upgrade ships, advance the story.
**Long term:** build a network of owned planets and trade routes, finish the campaign.

## 4. The mothership

The mothership is the player's home base and moves between systems.

- **Modules** (PROPOSED): Hangar (how many mining ships you can carry), Cargo Hold (storage), Fabricator (crafting), Refinery (process raw ore), Engines (travel range and speed), Sensors (reveal planet resources before buying).
- Each module upgrades with credits and crafted parts.
- **OPEN.** Can the player own more than one mothership later?
- **OPEN.** Does travel cost fuel (a resource to manage), or only time?

## 5. Galaxy and planets

### 5.1 Galaxy map
- Made of star systems connected by travel routes.
- PROPOSED: a hand-designed starting region for the story, with procedurally generated systems further out for replay value.
- **OPEN.** Fixed galaxy for everyone, or a different seed per player?

### 5.2 Planets
Each planet has:
- **Type** (rocky, ice, gas giant, volcanic, ocean, desert, etc.), which sets its resource mix
- **Resource deposits** with size and richness that deplete or regenerate over time
- **Price** to buy
- **Population/market** (if inhabited): what it buys, what it needs, what it pays
- **Hazards** that affect mining ships (heat, storms, radiation)

### 5.3 Buying a planet
- PROPOSED: you buy **mining rights** from the planet's owner. Uninhabited planets are cheaper but have no market. Inhabited planets may restrict where you mine.
- **OPEN.** Can planets be lost (rights expire, rivals buy them out, rebellions)?
- **OPEN.** Can players build on owned planets (outposts, refineries, spaceports)?

## 6. Mining ships

- Deployed from the mothership hangar to a planet's surface.
- Each ship has stats: **Drill power** (mining rate), **Cargo capacity**, **Speed** (trip time), **Durability** (hazard resistance), **Specialty** (some resources need special drills).
- PROPOSED ship classes: Scout Drone (cheap, small), Hauler (big cargo, slow), Deep Driller (rare resources), Hazard Rig (works in extreme environments).
- **Upgrades:** each stat has upgrade tiers paid with credits plus crafted parts.
- **OPEN.** Do ships get damaged or destroyed and need repair?
- **OPEN.** Is mining hands-off (assign and wait) or does it have an active mini-game?

## 7. Resources

PROPOSED tiers (names are placeholders):

| Tier | Examples | Found on |
|---|---|---|
| Common | Iron, Silica, Ice, Carbon | Most planets |
| Uncommon | Copper, Titanium, Helium-3 | Specific planet types |
| Rare | Platinum, Crystals, Exotic Gas | Deep deposits, hazardous planets |
| Legendary | **OPEN.** story-linked materials | Late-game or story locations |

**OPEN.** Does Tim want to invent fictional resources for the world, or use real-sounding ones?

## 8. Crafting

- Done in the mothership Fabricator (and later on owned planets, if outposts exist).
- Recipes turn resources into **intermediate parts** and **finished goods**.
- Example chain (PROPOSED):
  - Iron + Carbon → Steel Plate
  - Copper + Silica → Circuit
  - Steel Plate + Circuit → Machine Part
  - Machine Part + Titanium → Drill Head (ship upgrade)
  - Ice → Water; Water + Carbon → Life Support Pack (sold to colonies)
- Crafting takes time; higher Fabricator levels craft faster and run more queues.
- Recipes are unlocked through progression, story, or buying blueprints.
- **OPEN.** How deep should the tree go? (Roughly 20 items for a lean game, 60+ for a deep one.)

## 9. Economy and trade

- **Credits** are the main currency.
- Each inhabited planet has a market: prices move with supply and demand.
- **Needs/contracts:** planets post requests ("we need 50 Life Support Packs in 3 days") with bonus pay and reputation.
- **Reputation** per planet or faction unlocks better prices, rare blueprints, and story events.
- PROPOSED: prices recover over time, so dumping the same item repeatedly drops its price.
- **OPEN.** Any premium currency or real-money purchases? (Recommend no for a first version.)

## 10. Progression

- Unlock new star systems by upgrading engines and completing story chapters.
- Mothership modules, ship classes, and recipes unlock as you progress.
- PROPOSED: player rank or company level, raised by total trade volume.
- Achievements for milestones.

## 10A. Law, crime and bounties

Decided by Tim (2026-11-08); details below are PROPOSED.

- **Attacking another player** who is not wanted is a crime. The Kingdom fines you, and you become **Wanted**.
- **Wanted players** carry a **bounty**. Any player who defeats a Wanted player collects the bounty, with no fine.
- Fines add to your debt with the Kingdom. Unpaid fines grow the bounty on your head, so crime can drag a player right back into the debt they worked to clear (fitting the ex-prisoner story).
- Wanted status clears when you pay your fines, or when someone collects your bounty.
- PROPOSED safe zones: Kingdom-patrolled systems (including the starting system) where no player combat is allowed, so new players can't be farmed.
- PROPOSED loss on defeat: you lose part of the cargo you're carrying (not owned planets or ships), and it drops for the winner.
- **OPEN.** What is combat like? Real-time ship fights, or a quick automatic battle resolved by ship stats?
- **OPEN.** Can players attack mining ships on someone's planet, or only motherships in space?
- **OPEN.** Can players opt out of PvP entirely (a peaceful mode)?
- **OPEN.** Are there NPC criminals with bounties too, for players who don't want to fight people?

## 11. User interface

Main screens (PROPOSED). Each one needs a phone layout and a desktop layout:
1. **Galaxy map:** systems, routes, travel
2. **System view:** planets in orbit, buy and deploy
3. **Planet view:** deposits, active ships, hazards, market
4. **Mothership:** modules, hangar, upgrades
5. **Fabricator:** recipes and crafting queues
6. **Market/contracts:** buy, sell, accept contracts
7. **Story/log:** dialogue, mission log
8. **Account:** sign in, save slots, settings

**OPEN.** Visual style: pixel art, flat vector, or 3D?

## 12. Technical design

### 12.1 Requirements from Tim
- Runs in the browser
- User accounts ("user control")
- Cloud-based saves and data

### 12.2 Stack (decided: Firebase, Tim already has it)

- **Client:** TypeScript + React built with Vite. The prototype draws the star map in SVG, which keeps it light and sharp on phones; Phaser can be added later if we want animated ship flights and effects.
- **Auth:** Firebase Authentication (email/password plus Google sign-in to start)
- **Cloud saves and data:** Cloud Firestore
- **Server logic:** Cloud Functions for anything the browser must not be trusted with: buying planets, selling goods, crafting results, offline progress, contract payouts
- **Hosting:** Firebase Hosting
- **Security:** Firestore security rules so each player can read only their own save and cannot write credits or inventory directly; those change only through Cloud Functions
- **Local dev:** Firebase Emulator Suite for auth, Firestore and functions

**Multiplayer note:** because players share a galaxy and can fight, all combat, fines and bounty payouts must be decided by Cloud Functions, never by the browser. Firestore real-time listeners are fine for seeing other ships and turn-based or automatic battles. Fast real-time ship combat would need a dedicated game server alongside Firebase, so the combat style choice in §10A affects the tech stack.

**OPEN.** Is the existing Firebase project the one to use, or should this game get its own project? (Own project recommended, keeps billing and data separate.)

### 12.3 Save data (PROPOSED)
- One save per account to start, with room for multiple slots.
- Saved: mothership state, fleet, owned planets, inventory, credits, reputation, story progress, timestamps.
- Autosave on key actions and every N seconds; the server checks values so a player can't edit their way to infinite credits.
- Offline progress computed on the server from the last-saved timestamp, capped (e.g. 8 hours).

### 12.4 Admin and tooling
- Balance data (resources, recipes, prices) kept in data files or database tables, not hard-coded, so it can be tuned without redeploying.
- Admin view to inspect and fix player accounts.

## 13. Art and audio

- **OPEN.** Style (see section 11).
- **OPEN.** Source: Tim's own assets, commissioned, or free/licensed asset packs.
- Audio: ambient space music, UI sounds, mining and travel effects.

## 14. Monetisation

**OPEN.** Free, paid, or free with optional purchases? Recommend free with no purchases for the first version.

## 15. Scope and milestones (PROPOSED)

1. **Prototype:** one system, two planets, one ship type, three resources, a few recipes, local save only.
2. **Accounts and cloud saves:** sign-in, server-validated saves.
3. **Vertical slice:** story chapter 1, full UI, three systems, upgrades, contracts.
4. **Content expansion:** more systems, ships, recipes, story chapters.
5. **Polish and alpha:** balance, art pass, playtesting.

## 16. Open questions summary

1. Target audience and session length (§1)
2. One galaxy or several shards; player-to-player trading (§1)
3. Story: Kingdom ruler, rival, ending, names (§2.2)
3a. Combat style, what can be attacked, PvP opt-out, NPC bounties (§10A)
4. Multiple motherships? Fuel? (§4)
5. Fixed or per-player galaxy (§5.1)
6. Can planets be lost? Building on planets? (§5.3)
7. Ship damage? Active mining mini-game? (§6)
8. Fictional or real-sounding resources (§7)
9. Crafting depth (§8)
10. Monetisation (§9, §14)
11. Visual style and art source (§11, §13)
12. Which Firebase project to use (§12.2)
