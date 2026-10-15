// Full afrobeats songs, played through YouTube's embedded player (the IFrame Player API)
// from the built-in list in songs.js. YouTube's rules say the player must stay visible
// (at least 200×200) while it plays, so it sits in the corner music card; it hides only when muted.
// Browsers only allow sound after the player taps or presses a key, so call start() from one.

import { SONGS } from './songs.js';

const MUTE_KEY = 'lanedash:muted';
const FIRST = ['Davido', 'Wizkid', 'Adekunle Gold', 'Abefe']; // the mix opens with these
export const ARTISTS = [...new Set(SONGS.map((s) => s.artist))];

const box = document.getElementById('player');
let player = null; // YT.Player, once YouTube's script has loaded
let list = startMix(); // what's playing now and what comes next
let index = 0;
let started = false; // the player has tapped, so sound is allowed
let muted = load();
let paused = false;
let errors = 0; // songs that failed in a row
const listeners = new Set();

function load() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffled, with one song from each FIRST artist up front, so the mix keeps changing artist.
function startMix() {
  const rest = shuffle(SONGS);
  const head = FIRST.map((artist) => rest.find((s) => s.artist === artist)).filter(Boolean);
  return [...shuffle(head), ...rest.filter((s) => !head.includes(s))];
}

const emit = () => listeners.forEach((fn) => fn());

/** Calls fn whenever the song, mute or loading state changes. */
export function onChange(fn) {
  listeners.add(fn);
}

/** Built-in songs matching `term` (part of a song or artist name). */
export function search(term) {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  return SONGS.filter((s) => {
    const text = `${s.title} ${s.artist}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

const on = () => started && !muted && document.visibilityState === 'visible';

function apply() {
  box.hidden = !started || muted; // never hidden while playing
  if (!player) return;
  player.setVolume(paused ? 35 : 85); // quieter while the game is paused
  const state = player.getPlayerState();
  const playing = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
  if (on() && !playing) player.playVideo();
  if (!on() && playing) player.pauseVideo();
}

function playAt(i) {
  index = (i + list.length) % list.length;
  if (player) {
    if (on()) player.loadVideoById(list[index].id);
    else player.cueVideoById(list[index].id);
  }
  emit();
}

// YouTube's script calls this global once it has loaded.
window.onYouTubeIframeAPIReady = () => {
  new YT.Player('playerFrame', {
    width: 240,
    height: 200,
    videoId: list[index].id,
    playerVars: { playsinline: 1, disablekb: 1, rel: 0, modestbranding: 1 }, // disablekb: arrow keys stay with the game
    events: {
      onReady: (e) => {
        player = e.target;
        apply();
        emit();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) errors = 0;
        if (e.data === YT.PlayerState.ENDED) playAt(index + 1); // the whole song played: on to the next
      },
      onError: () => {
        if (++errors < list.length) playAt(index + 1); // can't play here (e.g. embedding turned off): skip it
      },
    },
  });
};
const script = document.createElement('script');
script.src = 'https://www.youtube.com/iframe_api';
document.head.append(script);

document.addEventListener('visibilitychange', apply);

/** Starts the music. Call from a tap or key press (browsers block sound before one). */
export function start() {
  started = true;
  apply();
}

/** Plays `track`, then carries on through `tracks` (e.g. the list it was picked from). */
export function play(track, tracks = [track]) {
  list = tracks;
  playAt(Math.max(0, tracks.indexOf(track)));
}

export const next = () => playAt(index + 1);
export const prev = () => playAt(index - 1);
export const current = () => list[index] ?? null;
export const isLoading = () => !player;
export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {}
  apply();
  emit();
}

export const toggleMuted = () => setMuted(!muted);

/** Turns the music down while the game is paused. */
export function setPaused(value) {
  paused = value;
  apply();
}
