# Lane Dash

A small three.js endless runner built for the start.ng platform. You run down three lanes, jump low barriers, dodge tall blocks and grab coins.

**start.ng handles sign-in.** If you're signed in on start.ng, the game knows who you are and dresses the runner in your start.ng look. If you aren't, it asks you to sign in on start.ng or play as a guest.

**Play it:** https://blackburn0.github.io/HNG-Game/ (guest only: start.ng sign-in works when the game is served from `<name>.start.ng`)

## How start.ng sign-in works

1. The game loads `start.ng/connect` in a hidden iframe and asks "who is signed in?" with `postMessage`.
2. start.ng answers only pages on `*.start.ng` (or `*.start.localhost` when testing), with `{ id, name, style }` or `null`. The game never gets the start.ng token or email.
3. **Sign in with start.ng** sends the player to `start.ng/?return_to=<game URL>`. After signing in, start.ng sends them back, and the game picks them up.
4. When the player comes back to the game tab, it checks again, so signing in or out on start.ng shows up in the game.

This needs the `game-connect` change in `startng-fe` (`src/games.ts`). No back-end or database changes.

The style comes from the player's character in start.ng's character creator. Accounts without a character get a starting look worked out from their id:

```js
{
  body: 'female',            // female | male
  primaryColor: '#a55eea',   // top
  secondaryColor: '#0c6e5a', // bottoms
  skinColor: '#8d5524',
  hairColor: '#17120f',
  hair: 'braids',            // short | afro | braids | bun | ponytail | dreads | bald
  hat: 'none',               // none | cap | beanie | tophat | crown
  accessory: 'earrings',     // none | glasses | earrings | beard | scarf | backpack
}
```

Missing or unknown values fall back to defaults, so new options on start.ng won't break the game.

## Files

| File | Role |
| --- | --- |
| `src/platform.js` | Talks to start.ng: `getCurrentUser`, `onUserChange`, `signIn`. |
| `src/character.js` | Builds the runner and applies a style. |
| `src/game.js` | The game. |
| `src/scores.js` | Best scores and the leaderboard (stored in this browser). |

## Run locally

Sign-in only works when start.ng and the game share a parent domain, as `start.ng` and `lanedash.start.ng` will. Locally that means start.ng at `http://start.localhost:5173` and the game served by the start.ng game Worker at `http://lanedash.start.localhost:8787`.

To try the game on its own (guest only):

```bash
npm start
```

Then open http://localhost:5173.

Controls: ← → / A D to switch lanes, ↑ / W / Space to jump. On mobile, swipe or tap.
