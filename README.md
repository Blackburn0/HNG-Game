# Lane Dash

A small three.js endless runner built for the start.ng platform. You run down three lanes, jump low barriers, dodge tall blocks and grab coins. The runner is dressed in the signed-in user's **central start.ng style** (shirt, pants/hat and skin colours, hat, accessory), and it updates live when that style changes.

## Run locally

```bash
npm start
```

Then open http://localhost:5173. No install step is needed. three.js loads from a CDN.

1. Click **Sign in on start.ng**. This opens `startng.html`, a mock of the platform.
2. Pick a test user, then click **Play Lane Dash**.
3. Keep both tabs open. Change colours or the hat on the start.ng tab and watch the runner change in the game.

Controls: ← → / A D to switch lanes, ↑ / W / Space to jump. On mobile, swipe or tap.

## How start.ng is wired in

| File | Role |
| --- | --- |
| `src/platform.js` | The only platform import the game uses. Point it at the real SDK when start.ng ships. |
| `src/startng-mock.js` | Fake SDK: `getCurrentUser`, `onUserChange`, `signIn`, `signOut`, `updateStyle`. Backed by localStorage. |
| `startng.html` + `src/startng-page.js` | Mock start.ng site: sign in and edit your central style. |
| `src/character.js` | Builds the runner and applies a style: `applyStyle({ primaryColor, secondaryColor, skinColor, hat, accessory })`. |
| `src/game.js` | The game. |
| `src/scores.js` | Per-user best scores and the leaderboard (stored in this browser). |

The style shape the game expects:

```js
{ primaryColor: '#ff6b6b', secondaryColor: '#2b2f4a', skinColor: '#8d5524', hat: 'cap', accessory: 'backpack' }
// hat: none | cap | beanie | tophat | crown
// accessory: none | glasses | scarf | backpack
```

When the real start.ng API is ready, map its user/profile fields onto this shape in `src/platform.js`.
