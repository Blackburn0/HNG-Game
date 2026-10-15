import * as THREE from 'three';
import * as platform from './platform.js';
import * as scores from './scores.js';
import { createCharacter } from './character.js';

const LANES = [-2.2, 0, 2.2];
const START_SPEED = 14;
const MAX_SPEED = 34;
const ACCEL = 0.35; // speed gained per second
const GRAVITY = 30;
const JUMP_SPEED = 10.5;
const SPAWN_Z = -90;
const DESPAWN_Z = 8;
const LOOP = 110; // length of the scenery loop

const $ = (id) => document.getElementById(id);
const ui = {
  avatar: $('avatar'), username: $('username'), hudLink: $('hudLink'),
  score: $('score'), coins: $('coins'), best: $('best'),
  overlay: $('overlay'), title: $('title'), message: $('message'),
  action: $('action'), secondary: $('secondary'), board: $('board'), boardTitle: $('boardTitle'),
};

const GUEST = { id: 'guest', name: 'Guest', guest: true };

// --- Scene -----------------------------------------------------------------

const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const SKY = new THREE.Color('#9fd8ff');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 35, 95);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
const CAM_HEIGHT = 4.2;
const CAM_DIST = 7.5;

scene.add(new THREE.HemisphereLight('#ffffff', '#5a7d4f', 1.2));
const sun = new THREE.DirectionalLight('#ffffff', 1.6);
sun.position.set(-6, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
scene.add(sun);

const road = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 220), new THREE.MeshStandardMaterial({ color: '#3b3f4a' }));
road.rotation.x = -Math.PI / 2;
road.position.z = -90;
road.receiveShadow = true;
scene.add(road);

const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 220), new THREE.MeshStandardMaterial({ color: '#7cc46a' }));
grass.rotation.x = -Math.PI / 2;
grass.position.set(0, -0.01, -90);
grass.receiveShadow = true;
scene.add(grass);

// Lane dashes and trees loop forever to sell the feeling of speed.
const scenery = [];
const dashGeo = new THREE.BoxGeometry(0.12, 0.02, 2);
const dashMat = new THREE.MeshBasicMaterial({ color: '#f5f5f5' });
for (let z = DESPAWN_Z; z > DESPAWN_Z - LOOP; z -= 5) {
  for (const x of [-1.1, 1.1]) {
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(x, 0.01, z);
    scene.add(dash);
    scenery.push(dash);
  }
}
const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 6);
const trunkMat = new THREE.MeshStandardMaterial({ color: '#7a5230' });
const leafGeo = new THREE.ConeGeometry(0.9, 2.2, 7);
const leafMat = new THREE.MeshStandardMaterial({ color: '#2f8f46' });
for (let z = DESPAWN_Z; z > DESPAWN_Z - LOOP; z -= 5.5) {
  for (const side of [-1, 1]) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.5;
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = 1.9;
    leaves.castShadow = true;
    tree.add(trunk, leaves);
    tree.position.set(side * (5.5 + Math.random() * 7), 0, z - Math.random() * 3);
    tree.scale.setScalar(0.8 + Math.random() * 0.7);
    scene.add(tree);
    scenery.push(tree);
  }
}

// --- Obstacles and coins -----------------------------------------------------

const geo = {
  low: new THREE.BoxGeometry(1.8, 0.9, 0.4), // jump over it
  tall: new THREE.BoxGeometry(1.8, 2.6, 1.2), // switch lanes
  coin: new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20).rotateX(Math.PI / 2),
};
const mat = {
  low: new THREE.MeshStandardMaterial({ color: '#ff9f43' }),
  tall: new THREE.MeshStandardMaterial({ color: '#e84a5f' }),
  coin: new THREE.MeshStandardMaterial({ color: '#ffd166', metalness: 0.6, roughness: 0.25, emissive: '#7a5500' }),
};
const HEIGHT = { low: 0.9, tall: 2.6, coin: 0 };
const DEPTH = { low: 0.4, tall: 1.2, coin: 0.08 };

const movers = [];

function addMover(kind, lane, z) {
  const mesh = new THREE.Mesh(geo[kind], mat[kind]);
  mesh.position.set(LANES[lane], kind === 'coin' ? 1 : HEIGHT[kind] / 2, z);
  mesh.castShadow = kind !== 'coin';
  scene.add(mesh);
  movers.push({ kind, mesh });
}

function removeMover(i) {
  scene.remove(movers[i].mesh);
  movers.splice(i, 1);
}

// One row: 1–2 blocked lanes, always one free lane, often a coin trail leading into it.
function spawnRow() {
  const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
  const blocked = Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < blocked; i++) addMover(Math.random() < 0.45 ? 'tall' : 'low', lanes[i], SPAWN_Z);
  if (Math.random() < 0.75) {
    for (let k = 0; k < 5; k++) addMover('coin', lanes[blocked], SPAWN_Z + 2 + k * 1.6);
  }
}

// --- Player -----------------------------------------------------------------

const hero = createCharacter();
scene.add(hero.root);

let user = null;
let state = 'ready'; // ready | running | over
let time = 0;
let overAt = -1;
let speed, distance, coins, lane, vy, untilSpawn, shake;

function reset() {
  while (movers.length) removeMover(0);
  speed = START_SPEED;
  distance = 0;
  coins = 0;
  lane = 1;
  vy = 0;
  untilSpawn = 0;
  shake = 0;
  hero.root.position.set(0, 0, 0);
  hero.root.rotation.set(0, 0, 0);
  updateHud();
}

const currentScore = () => Math.floor(distance) + coins * 10;

function updateHud() {
  ui.score.textContent = currentScore();
  ui.coins.textContent = coins;
}

function start() {
  reset();
  state = 'running';
  ui.overlay.hidden = true;
}

function crash() {
  state = 'over';
  overAt = time;
  shake = 0.35;
  const score = currentScore();
  const local = scores.submit(user, score); // this browser's best, for the HUD
  ui.best.textContent = local.best;
  const scored = `${user.name}, you scored ${score} with ${coins} coins.`;

  if (!platform.START_NG || user.guest) {
    showOverlay({
      title: local.isBest ? 'New best!' : 'Ouch!',
      message: platform.START_NG ? `${scored} Sign in to get on the leaderboard.` : scored,
      button: ['Run again', start],
      secondary: platform.START_NG ? ['Sign in with start.ng', platform.signIn] : null,
      board: true,
    });
    return;
  }

  // Signed in on start.ng: save the score there, then show the shared leaderboard.
  const run = overAt;
  const saving = platform.submitScore(score);
  showOverlay({ title: 'Ouch!', message: `${scored} Saving…`, button: ['Run again', start], board: true, saving });
  saving.then((result) => {
    if (state !== 'over' || overAt !== run) return; // already playing again
    if (!result) {
      ui.message.textContent = `${scored} Couldn't save your score this time.`;
      return;
    }
    if (result.improved) ui.title.textContent = 'New best!';
    ui.best.textContent = result.best;
    ui.message.textContent = `${scored} You're #${result.rank} on the leaderboard.`;
  });
}

function playAsGuest() {
  refreshUser(GUEST);
}

function jump() {
  if (hero.root.position.y === 0) vy = JUMP_SPEED;
}

function moveLane(dir) {
  lane = Math.max(0, Math.min(2, lane + dir));
}

// --- Overlay / HUD -----------------------------------------------------------

// entry: { rank, name, color, score, player_id? }
function leaderboardRow(entry) {
  const li = document.createElement('li');
  if (user && !user.guest && entry.player_id === user.id) li.className = 'me';
  const dot = document.createElement('span');
  dot.className = 'dot';
  dot.style.background = entry.color ?? '#9aa3b5';
  const name = document.createElement('span');
  name.textContent = `${entry.rank}. ${entry.name}`;
  const score = document.createElement('span');
  score.className = 'score';
  score.textContent = entry.score;
  li.append(dot, name, score);
  return li;
}

function setBoard(title, entries = []) {
  ui.boardTitle.textContent = title;
  ui.boardTitle.hidden = !title;
  ui.board.replaceChildren(...entries.map(leaderboardRow));
}

// On start.ng the board is the game's shared start.ng leaderboard; anywhere else it's this
// browser's own scores. `saving` is a score being saved, to wait for before loading.
let boardRequest = 0;
async function loadBoard(saving) {
  const request = ++boardRequest;
  if (!platform.START_NG) {
    setBoard('Best on this device', scores.top(5).map((e, i) => ({ ...e, rank: i + 1 })));
    return;
  }
  setBoard('Leaderboard: loading…');
  await saving;
  const entries = await platform.getLeaderboard(10);
  if (request !== boardRequest) return; // the overlay has moved on
  if (!entries) setBoard("Couldn't load the leaderboard");
  else if (!entries.length) setBoard('Leaderboard: no scores yet. Be the first!');
  else setBoard('start.ng leaderboard', entries);
}

// What the overlay's two buttons do right now.
const actions = { primary: null, secondary: null };

// button / secondary are [label, onClick]; leave one out to hide it.
function showOverlay({ title, message, button, secondary, board = false, saving = null }) {
  ui.title.textContent = title;
  ui.message.textContent = message;
  for (const [el, key, spec] of [[ui.action, 'primary', button], [ui.secondary, 'secondary', secondary]]) {
    el.hidden = !spec;
    if (spec) el.textContent = spec[0];
    actions[key] = spec?.[1] ?? null;
  }
  if (board) loadBoard(saving);
  else {
    boardRequest++;
    setBoard('');
  }
  ui.overlay.hidden = false;
}

function showIdle() {
  const signIn = platform.START_NG ? ['Sign in with start.ng', platform.signIn] : null;
  if (!user) {
    showOverlay({
      title: 'Lane Dash',
      message: signIn
        ? 'Sign in with start.ng to play as yourself, with your own look. Or jump in as a guest.'
        : "start.ng sign-in isn't available here, so you'll play as a guest.",
      button: signIn ?? ['Play as guest', playAsGuest],
      secondary: signIn && ['Play as guest', playAsGuest],
    });
  } else if (user.guest) {
    showOverlay({
      title: 'Lane Dash',
      message: 'Playing as a guest. Sign in with start.ng to get your own look and put your name on the scores.',
      button: ['Play', start],
      secondary: signIn,
      board: true,
    });
  } else {
    showOverlay({
      title: 'Lane Dash',
      message: `Hi ${user.name}! Your runner wears your start.ng look.`,
      button: ['Play', start],
      board: true,
    });
  }
}

function overlayAction(key) {
  if (state === 'running' || time - overAt < 0.5) return; // don't restart by accident right after a crash
  actions[key]?.();
}

function refreshUser(u) {
  if (!u && user?.guest) u = user; // still signed out on start.ng: a guest carries on as a guest
  const switched = (u?.id ?? null) !== (user?.id ?? null);
  user = u;
  hero.applyStyle(u?.style); // default look for guests and signed-out players
  ui.avatar.style.background = u?.style?.primaryColor ?? '#555';
  ui.avatar.textContent = u ? u.name[0].toUpperCase() : '?';
  ui.username.textContent = u ? u.name : 'Not signed in';
  ui.best.textContent = u ? scores.getBest(u.id) : 0;
  ui.hudLink.hidden = !platform.START_NG || (u && !u.guest);
  if (switched) {
    reset();
    state = 'ready';
    showIdle();
  }
}

// --- Input ------------------------------------------------------------------

addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
  if (state !== 'running') {
    if (e.code === 'Space' || e.code === 'Enter') overlayAction('primary');
    return;
  }
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLane(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') moveLane(1);
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') jump();
});

ui.action.addEventListener('click', () => overlayAction('primary'));
ui.secondary.addEventListener('click', () => overlayAction('secondary'));
ui.hudLink.addEventListener('click', (e) => {
  e.preventDefault();
  platform.signIn();
});

let touch = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touch = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (!touch || state !== 'running') return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) moveLane(Math.sign(dx));
  else jump(); // swipe up or tap
});

// --- Loop -------------------------------------------------------------------

function step(dt) {
  time += dt;
  const p = hero.root.position;

  vy -= GRAVITY * dt;
  p.y += vy * dt;
  if (p.y <= 0) {
    p.y = 0;
    vy = 0;
  }

  if (state === 'running') {
    speed = Math.min(MAX_SPEED, speed + ACCEL * dt);
    const move = speed * dt;
    distance += move;

    untilSpawn -= move;
    if (untilSpawn <= 0) {
      spawnRow();
      untilSpawn = Math.max(11, 17 - (speed - START_SPEED) * 0.25);
    }

    const targetX = LANES[lane];
    p.x += (targetX - p.x) * Math.min(1, dt * 14);
    hero.root.rotation.z = (p.x - targetX) * 0.12; // lean into lane changes

    for (const obj of scenery) {
      obj.position.z += move;
      if (obj.position.z > DESPAWN_Z) obj.position.z -= LOOP;
    }

    for (let i = movers.length - 1; i >= 0; i--) {
      const m = movers[i];
      m.mesh.position.z += move;
      const dx = Math.abs(m.mesh.position.x - p.x);
      const dz = Math.abs(m.mesh.position.z);
      if (m.kind === 'coin') {
        m.mesh.rotation.y += dt * 4;
        if (dx < 0.9 && dz < 0.7 && p.y < 1.4) {
          coins++;
          removeMover(i);
          continue;
        }
      } else if (dx < 1.3 && dz < DEPTH[m.kind] / 2 + 0.25 && p.y < HEIGHT[m.kind] - 0.05) {
        crash();
        return;
      }
      if (m.mesh.position.z > DESPAWN_Z) removeMover(i);
    }
    updateHud();
  } else if (state === 'over') {
    hero.root.rotation.x = Math.max(-1.45, hero.root.rotation.x - dt * 5); // faceplant
  }

  for (const m of movers) if (m.kind === 'coin') m.mesh.rotation.y += dt * 2;
  hero.animate(time, { running: state === 'running', airborne: p.y > 0, speed });

  // Camera follows the runner sideways, with a little shake after a crash.
  shake = Math.max(0, shake - dt);
  const camX = camera.position.x + (p.x * 0.35 - camera.position.x) * Math.min(1, dt * 5);
  const jitter = () => (Math.random() - 0.5) * shake;
  camera.position.set(camX + jitter(), CAM_HEIGHT + jitter(), CAM_DIST);
  camera.lookAt(camX, 1.2, -8);
}

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 78 : 60; // see all three lanes on portrait phones
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// --- Boot -------------------------------------------------------------------

reset();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  step(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
});

if (platform.START_NG) showOverlay({ title: 'Lane Dash', message: 'Checking your start.ng sign-in…' });
refreshUser(await platform.getCurrentUser());
showIdle();
platform.onUserChange(refreshUser);
