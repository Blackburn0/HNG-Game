// Per-player best scores for Lane Dash, kept in this browser.
const KEY = 'lanedash:scores';

function all() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function getBest(playerId) {
  return all()[playerId]?.score ?? 0;
}

export function submit(player, score) {
  const scores = all();
  const prev = scores[player.id]?.score ?? 0;
  const isBest = score > prev;
  scores[player.id] = { score: Math.max(prev, score), name: player.name, color: player.style?.primaryColor ?? '#9aa3b5' };
  localStorage.setItem(KEY, JSON.stringify(scores));
  return { best: Math.max(prev, score), isBest };
}

export function top(n = 5) {
  return Object.values(all())
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
