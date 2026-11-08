# Planet Miner

A browser-based space mining and trading game. You command a large mothership, travel to star systems, buy planets, send down mining ships to pull resources, craft goods, and sell or supply them to planets that need them. Progress is tied to your account and saved to the cloud, so you can pick up where you left off on any device.

> Status: **Design phase.** No game code yet. See [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) for the full design.

## Core loop

1. **Travel** your mothership to a star system.
2. **Buy** a planet (or the mining rights to it).
3. **Deploy** mining ships to the surface to extract resources.
4. **Upgrade** those ships for better yield, speed, and capacity.
5. **Craft** resources into items in your mothership's fabricator.
6. **Sell or supply** items to planets that buy or need them, earning credits and reputation.
7. **Expand** to new systems, richer planets, and better ships.

## Key features (planned)

- Fly between star systems on a galaxy map
- Purchase and own planets, each with its own resource mix
- Fleets of mining ships with upgrade paths
- Crafting tree that turns raw resources into tradeable and buildable goods
- Planet economies with supply, demand, and contracts
- A story campaign that unfolds as you expand
- Plays on desktop and mobile browsers, with touch and mouse controls
- User accounts with cloud saves (pick up on any device)

## Story in one line

You're an ex-convict sent out to mine the Kingdom's planets. Every planet belongs to the Crown, so you pay for the right to dig, then craft, haggle and hustle your way from prisoner to tycoon. Light-hearted, funny sci-fi.

## Tech stack

| Layer | Choice |
|---|---|
| Game client | TypeScript + Phaser 3, built with Vite |
| UI (menus, inventory, crafting) | React overlay on top of the game canvas |
| Auth | Firebase Authentication |
| Cloud saves and data | Cloud Firestore |
| Server logic (purchases, selling, offline progress) | Cloud Functions |
| Hosting | Firebase Hosting |

Details in the design doc, section 12.

## Project layout (planned)

```
planet-miner/
├── README.md
├── docs/
│   └── GAME_DESIGN.md     # Full game design document
├── client/                # Browser game (coming later)
├── server/                # API / functions (coming later)
└── shared/                # Shared types, balance data (coming later)
```

## Getting started

Nothing to run yet. Once the stack is chosen this section will cover:

- Prerequisites (Node version, Firebase CLI)
- Firebase project config and environment variables
- `npm install` / `npm run dev`
- Running tests

## Roadmap

- [ ] Finish and sign off the game design doc
- [x] Pick the tech stack (Firebase)
- [ ] Prototype: fly, buy one planet, mine one resource, sell it
- [ ] Accounts and cloud saves
- [ ] Crafting system and planet economies
- [ ] Story campaign, chapter 1
- [ ] Playtest and balance pass
- [ ] Public alpha

## License

To be decided.
