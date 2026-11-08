# Planet Miner

A browser-based space mining and trading game. You command a large mothership, travel to star systems, buy planets, send down mining ships to pull resources, craft goods, and sell or supply them to planets that need them. Progress is tied to your account and saved to the cloud, so you can pick up where you left off on any device.

> Status: **Prototype.** A first playable build (one system, buy planets, mine, craft, sell, pay off your debt) runs in the browser with a local save. Accounts and cloud saves are next. See [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) for the full design.

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
- Shared galaxy with player combat: attack the innocent and get fined and wanted, hunt wanted players for bounties
- Plays on desktop and mobile browsers, with touch and mouse controls
- User accounts with cloud saves (pick up on any device)

## Story in one line

You're an ex-convict sent out to mine the Kingdom's planets. Every planet belongs to the Crown, so you pay for the right to dig, then craft, haggle and hustle to pay off your debt to the Kingdom. Step out of line and attack other players, and the fines pile back on. Hunt wanted players instead and collect their bounties. Light-hearted, funny sci-fi.

## Tech stack

| Layer | Choice |
|---|---|
| Game client | TypeScript + React, built with Vite (SVG star map; Phaser can be added later for richer visuals) |
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
├── index.html             # App entry
├── src/
│   ├── App.tsx            # UI: map, planet, fleet, craft, market, kingdom panels
│   └── game/
│       ├── data.ts        # Balance data: planets, resources, recipes, prices
│       └── state.ts       # Game rules (pure reducer), tick, local save
└── functions/             # Firebase Cloud Functions (coming in milestone 2)
```

## Getting started

Requires Node 20+ and npm.

```bash
npm install
npm run dev        # local dev server at http://localhost:5173 (add --host to test on your phone over Wi-Fi)
npm test           # game logic tests
npm run build      # production build into dist/
```

Every push to `main` runs the tests, builds, and deploys to GitHub Pages: https://timleitch.github.io/planet-miner/

The prototype saves to your browser's local storage. Firebase sign-in and cloud saves come in milestone 2.

## Roadmap

- [ ] Finish and sign off the game design doc
- [x] Pick the tech stack (Firebase)
- [x] Prototype: buy planets, mine, craft, sell, pay off the debt (local save)
- [ ] Accounts and cloud saves
- [ ] Crafting system and planet economies
- [ ] Story campaign, chapter 1
- [ ] Playtest and balance pass
- [ ] Public alpha

## License

To be decided.
