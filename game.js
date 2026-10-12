"use strict";

/* ================= helpers ================= */
// present when running inside the Android WebView shell; the native side
// owns alarm scheduling and the ringing sound there
const NATIVE = typeof AndroidBridge !== "undefined";

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (n) => String(n).padStart(2, "0");

// "HH:MM" (24h) -> {text: "6:41", ap: "am"}
function fmt12(time) {
  const [H, m] = time.split(":").map(Number);
  return { text: `${H % 12 || 12}:${fmt(m)}`, ap: H < 12 ? "am" : "pm" };
}

// "HH:MM" -> "in 7h 32m" until its next occurrence
function untilText(time) {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const mins = Math.max(1, Math.round((target - now) / 60000));
  const hh = Math.floor(mins / 60), mm = mins % 60;
  return hh > 0 ? `in ${hh}h ${mm}m` : `in ${mm}m`;
}

/* ================= pixel sprites ================= */
const PAL = {
  ".": null,
  K: "#2b3a55", // kiko outline
  W: "#f4f7ff",
  B: "#7fb2e5",
  D: "#4a7dbb",
  P: "#f2a0b2",
  k: "#3a2b55", // enemy outline
  p: "#a88ade",
  d: "#7a5cb8",
  C: "#4a5dbb",
  c: "#38468f",
  w: "#ffffff",
  m: "#5a3f86",
  Y: "#ffd977", // gold
  y: "#cf8c2e",
  G: "#79c356",
  g: "#3f7d47",
  R: "#e5484d",
  q: "#b3282e",
  T: "#3e9db0",
  t: "#2b7181",
  S: "#9aa3ad", // stone / steel
  s: "#667079",
};

const KIKO = [
  "...KK..........KK...",
  "..KWBK........KBWK..",
  "..KWWBK......KBWWK..",
  "..KWWWKKKKKKKKWWWK..",
  "..KWWWWWWWWWWWWWWK..",
  ".KWWWWWWWWWWWWWWWWK.",
  ".KWWKWWWWWWWWWWKWWK.",
  ".KWWWWWWWPPWWWWWWWK.",
  ".KWWWWWWKWWKWWWWWWK.",
  "..KWWWWWWWWWWWWWWK..",
  "..KKKKBBWWWWBBKKKK..",
  "...KBBBWWWWWWBBBK...",
  "..KBBWWWWWWWWWWBBK..",
  "..KBWWKWWWWWWKWWBK..",
  "..KKWWK.KKKK.KWWKK..",
  "...KKK........KKK...",
];

const FIEND = [
  "...........kkk......",
  "..........kCCwk.....",
  ".........kCCCwk.....",
  ".......kkCCCCk......",
  ".....kkCCCCCCkk.....",
  "....kCCCCCCCCCCk....",
  "...kppppppppppppk...",
  "...kppkkppppkkppk...",
  "..kppppppppppppppk..",
  "..kpppkkkkkkkkpppk..",
  "..kppppppmmppppppk..",
  "..kppdppppppppdppk..",
  "..kpppppppppppppk...",
  "..kdppppppppppdk....",
  "...kkppppppppkk.....",
  ".....kkkkkkkk.......",
];

const BAT = [
  "....................",
  "kk................kk",
  "kDDk............kDDk",
  "kDDDk...kkkk...kDDDk",
  "kDCDDk.kDDDDk.kDDCDk",
  ".kCDDDkDDDDDDkDDDCk.",
  ".kCDDDDDDDDDDDDDDCk.",
  "..kDDwkDDDDDDkwDDk..",
  "..kDDDDDDDDDDDDDDk..",
  "..kCDDkwDkkDwkDDCk..",
  "...kDDDDkkkkDDDDk...",
  "...kCDDDDDDDDDDCk...",
  "....kkCDDDDDDCkk....",
  "......kkDDDDkk......",
  "........kkkk........",
  "....................",
];

const GOLEM = [
  "....kkkkkkkkkkkk....",
  "...kSSSSSSSSSSSSk...",
  "..kSSsSSSSSSSSsSSk..",
  "..kSSSSSSSSSSSSSSk..",
  "..kSYYkSSSSSSkYYSk..",
  "..kSYYkSSSSSSkYYSk..",
  "..kSSSSSSSSSSSSSSk..",
  "..kSsSSkkkkkkSSsSk..",
  "..kSSSSSSSSSSSSSSk..",
  ".kSSkSSSSSSSSSSkSSk.",
  ".kSSkSsSSSSSSsSkSSk.",
  ".kkkkSSSSSSSSSSkkkk.",
  "...kSSSSskksSSSSk...",
  "...kSSSk....kSSSk...",
  "...kkkkk....kkkkk...",
  "....................",
];

const REAPER = [
  "..............SSS...",
  ".............SSSSS..",
  "..............kSk...",
  "......kkkkk...kSk...",
  ".....kmmmmmk..kSk...",
  "....kmmwwwmmk.kSk...",
  "....kmwwkwwmk.kSk...",
  "....kmmwwwmmk.kSk...",
  "...kmmmmmmmmmkkSk...",
  "...kmdmmmmmdmk.kk...",
  "...kmmmmmmmmmk......",
  "...kmdmmmmmmdk......",
  "....kmmmmmmmk.......",
  "....kmdmmmmdk.......",
  ".....kkkkkkk........",
  "....................",
];

const ETERNAL = [
  "....Y..YYYY..Y......",
  "....YYYYYYYYYY......",
  "...kppppppppppk.....",
  "..kppppppppppppk....",
  ".kppwwppppppwwppk...",
  ".kppwkppppppkwppk...",
  "kppppppppppppppppk..",
  "kpppkkkkkkkkkkpppk..",
  "kppppppmmmmppppppk..",
  "kppdpppppppppdpppk..",
  "kppppppppppppppppk..",
  "kpdpppppppppppdppk..",
  ".kppppppppppppppk...",
  ".kdppppppppppppdk...",
  "..kkppppppppppkk....",
  "....kkkkkkkkkk......",
];

/* ================= stages ================= */
const STAGES = [
  { name: "SNOOZE FIEND", map: FIEND, hp: 70, dmg: [10, 15], speed: 1, pips: 4 },
  { name: "DROWSE BAT", map: BAT, hp: 95, dmg: [12, 17], speed: 1.08, pips: 6 },
  { name: "NAPTIME GOLEM", map: GOLEM, hp: 125, dmg: [14, 20], speed: 1.18, pips: 8 },
  { name: "DREAM REAPER", map: REAPER, hp: 160, dmg: [16, 24], speed: 1.28, pips: 10 },
  { name: "THE ETERNAL SNOOZE", map: ETERNAL, hp: 210, dmg: [18, 28], speed: 1.4, pips: Infinity },
];

/* ================= classes ================= */
// defaults every class starts from; classes override a few knobs
const BASE_MODS = {
  atkFlat: 0, critMult: 1, zoneBonus: 0, parryWindow: 90, counterMult: 1,
  mashCap: 16, dmgTakenMult: 1, coinMult: 1, comboWindowMult: 1,
};

const CLASSES = [
  { id: "drifter", name: "Drifter", desc: "balanced and thrifty: +15% coins", mods: { coinMult: 1.15 } },
  { id: "guardian", name: "Guardian", desc: "wide parry window, counters hit 60% harder", mods: { parryWindow: 140, counterMult: 1.6 } },
  { id: "berserker", name: "Berserker", desc: "mash cap 22, crits +30%, but take +20% damage", mods: { mashCap: 22, critMult: 1.3, dmgTakenMult: 1.2 } },
  { id: "sage", name: "Sage", desc: "x3 zone 30% wider, combo timer 30% slower", mods: { zoneBonus: 0.3, comboWindowMult: 1.3 } },
];

const PET_PAD = 4; // rows of headroom above the pet so hats fit

// cosmetics and weapons: dx/dy are grid offsets from the pet map's top-left.
// weapons carry combat stats that stack with the class.
const COSMETICS = [
  {
    id: "nightcap", name: "nightcap", slot: "hat", price: 60, dx: 4, dy: -4,
    map: ["....kwwk....", "...kCCCCk...", "..kCCCCCCk..", ".kCCCCCCCCk.", "kCCCCCCCCCCk"],
  },
  {
    id: "crown", name: "royal crown", slot: "hat", price: 200, dx: 6, dy: -3,
    map: ["Y.Y..Y.Y", "YYYYYYYY", "yYYYYYYy"],
  },
  {
    id: "sprout", name: "lil sprout", slot: "hat", price: 40, dx: 8, dy: -3,
    map: [".GG.", "GGgG", ".gg."],
  },
  {
    id: "scarf-red", name: "red scarf", slot: "scarf", price: 50, dx: 3, dy: 9,
    map: [".qRRRRRRRRRRq.", "..qRRRRRRRRq..", "...RRq........", "...qRR........"],
  },
  {
    id: "scarf-teal", name: "teal scarf", slot: "scarf", price: 50, dx: 3, dy: 9,
    map: [".tTTTTTTTTTTt.", "..tTTTTTTTTt..", "...TTt........", "...tTT........"],
  },
  {
    id: "stick", name: "trusty stick", slot: "weapon", price: 30, dx: 16, dy: 3,
    stats: { atkFlat: 2 },
    map: ["....yy", "...yy.", "...yy.", "..yy..", "..yy..", ".yy...", ".yy...", "kyyk..", ".yy...", ".yy..."],
  },
  {
    id: "katana", name: "moon katana", slot: "weapon", price: 150, dx: 16, dy: 2,
    stats: { atkFlat: 4 },
    map: ["....ww", "...ww.", "...ww.", "..ww..", "..ww..", ".ww...", ".ww...", "kyyk..", ".yy...", "......"],
  },
  {
    id: "wand", name: "star wand", slot: "weapon", price: 250, dx: 16, dy: 2,
    stats: { zoneBonus: 0.2 },
    map: [".Y.Y..", "YYYY..", ".YY...", "..y...", "..y...", "..y...", "..y...", ".kyk..", "..y...", "......"],
  },
  {
    id: "hammer", name: "thunder hammer", slot: "weapon", price: 400, dx: 15, dy: 2,
    stats: { critMult: 1.5 },
    map: ["SSSSs.", "SSSSs.", "sSSss.", "..y...", "..y...", "..y...", "..y...", ".kyk..", "..y...", "......"],
  },
];

function drawSpriteAt(ctx, map, scale, ox, oy) {
  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = PAL[ch];
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    });
  });
}

function drawSprite(canvas, map, scale, ox = 0, oy = 0) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpriteAt(ctx, map, scale, ox, oy);
}

// pet plus equipped (or previewed) gear
function renderPet(canvas, scale, soloItem = null) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpriteAt(ctx, KIKO, scale, 0, PET_PAD * scale);
  const items = soloItem
    ? [soloItem]
    : ["hat", "scarf", "weapon"]
        .map((s) => COSMETICS.find((c) => c.id === Profile.equipped[s]))
        .filter(Boolean);
  items.forEach((it) => {
    // skip gear that would draw outside this canvas (e.g. weapons on the tiny mini icon)
    const wid = (it.dx + it.map[0].length) * scale;
    if (wid > canvas.width && !soloItem) return;
    drawSpriteAt(ctx, it.map, scale, it.dx * scale, (PET_PAD + it.dy) * scale);
  });
}

function renderPetEverywhere() {
  renderPet($("#pet-idle"), 8);
  renderPet($("#spr-you"), 8);
  renderPet($("#mini-you"), 1);
}

/* ================= audio ================= */
const AudioEngine = {
  ctx: null,
  sirenTimer: null,
  tempo: 340,
  vol: 0.12,

  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  beep(freq, dur, type = "square", vol = 0.12, when = 0) {
    const ctx = this.ensure();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  startSiren() {
    this.stopSiren();
    this.tempo = 340;
    this.vol = 0.12;
    let hi = true;
    const tick = () => {
      this.beep(hi ? 932 : 622, this.tempo / 1000 * 0.9, "sawtooth", this.vol);
      hi = !hi;
      this.sirenTimer = setTimeout(tick, this.tempo);
    };
    tick();
  },

  escalate() {
    this.tempo = Math.max(150, this.tempo * 0.82);
    this.vol = Math.min(0.3, this.vol + 0.04);
  },

  stopSiren() {
    if (this.sirenTimer) clearTimeout(this.sirenTimer);
    this.sirenTimer = null;
  },

  sfx(name) {
    if (name === "hit") { this.beep(392, 0.08, "square", 0.2); this.beep(262, 0.12, "square", 0.2, 0.06); }
    if (name === "crit") { this.beep(523, 0.07, "square", 0.22); this.beep(784, 0.07, "square", 0.22, 0.06); this.beep(1047, 0.12, "square", 0.22, 0.12); }
    if (name === "parry") { this.beep(1319, 0.06, "triangle", 0.25); this.beep(1760, 0.1, "triangle", 0.25, 0.05); }
    if (name === "hurt") { this.beep(147, 0.2, "sawtooth", 0.25); }
    if (name === "ko") { this.beep(220, 0.15, "sawtooth", 0.25); this.beep(165, 0.2, "sawtooth", 0.25, 0.12); this.beep(110, 0.35, "sawtooth", 0.25, 0.26); }
    if (name === "win") {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.beep(f, 0.14, "square", 0.2, i * 0.11));
    }
    if (name === "coin") { this.beep(988, 0.06, "square", 0.18); this.beep(1319, 0.12, "square", 0.18, 0.06); }
    if (name === "levelup") {
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.beep(f, 0.12, "triangle", 0.22, i * 0.09));
    }
    if (name === "stageup") {
      [262, 330, 392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.beep(f, 0.16, "square", 0.2, i * 0.1));
    }
  },
};

["pointerdown", "keydown"].forEach((ev) =>
  document.addEventListener(ev, () => AudioEngine.ensure(), { once: true, capture: true })
);

/* ================= profile ================= */
const Profile = {
  KEY: "snooze-fiend-profile",
  xp: 0,
  coins: 0,
  owned: [],
  equipped: { hat: null, scarf: null, weapon: null },
  clazz: "drifter",
  stage: 1,
  pips: 0,          // flawless alarm wins toward the next stage
  name: "",
  friends: [],      // decoded friend-code snapshots

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY));
      if (s) {
        this.xp = s.xp || 0;
        this.coins = s.coins || 0;
        this.owned = s.owned || [];
        this.equipped = { hat: null, scarf: null, weapon: null, ...s.equipped };
        this.clazz = s.clazz || "drifter";
        this.stage = clamp(s.stage || 1, 1, STAGES.length);
        this.pips = s.pips || 0;
        this.name = s.name || "";
        this.friends = s.friends || [];
      }
    } catch { /* fresh profile */ }
  },
  save() {
    localStorage.setItem(this.KEY, JSON.stringify({
      xp: this.xp, coins: this.coins, owned: this.owned, equipped: this.equipped,
      clazz: this.clazz, stage: this.stage, pips: this.pips,
      name: this.name, friends: this.friends,
    }));
  },

  // level n -> n+1 costs n*100 xp
  level() {
    let l = 1, rem = this.xp;
    while (rem >= l * 100) { rem -= l * 100; l++; }
    return { l, into: rem, need: l * 100 };
  },

  addRewards(xp, coins) {
    const before = this.level().l;
    this.xp += xp;
    this.coins += coins;
    this.save();
    return this.level().l > before;
  },

  // class + weapon combined battle modifiers
  mods() {
    const out = { ...BASE_MODS, ...(CLASSES.find((c) => c.id === this.clazz)?.mods || {}) };
    const wep = COSMETICS.find((c) => c.id === this.equipped.weapon);
    if (wep?.stats) {
      out.atkFlat += wep.stats.atkFlat || 0;
      out.critMult *= wep.stats.critMult || 1;
      out.zoneBonus += wep.stats.zoneBonus || 0;
    }
    return out;
  },
};

function updateProfileUI() {
  const { l, into, need } = Profile.level();
  $("#pet-level").textContent = `Lv ${l}`;
  $("#xp-fill").style.width = (into / need * 100) + "%";
  $("#coin-count").textContent = Profile.coins;
  $("#closet-coins").textContent = Profile.coins;
  renderStageUI();
}

function renderStageUI() {
  const st = STAGES[Profile.stage - 1];
  $("#stage-num").textContent = Profile.stage;
  $("#stage-enemy").textContent = st.name.toLowerCase();
  const pips = $("#stage-pips");
  if (st.pips === Infinity) {
    pips.innerHTML = `<span class="pip-max">MAX</span>`;
  } else {
    pips.innerHTML = Array.from({ length: st.pips }, (_, i) =>
      `<span class="pip ${i < Profile.pips ? "on" : ""}"></span>`).join("");
  }
}

/* ================= closet ================= */
function renderCloset() {
  const grid = $("#closet-grid");
  grid.innerHTML = "";
  COSMETICS.forEach((item) => {
    const owned = Profile.owned.includes(item.id);
    const worn = Profile.equipped[item.slot] === item.id;
    const div = document.createElement("div");
    div.className = "shop-item" + (worn ? " worn" : "");
    const statNote = item.stats
      ? `<span class="shop-stat">${item.stats.atkFlat ? `+${item.stats.atkFlat} dmg` : item.stats.zoneBonus ? "wider x3" : "crits +50%"}</span>`
      : "";
    div.innerHTML = `
      <canvas width="48" height="40"></canvas>
      <span class="shop-name">${item.name}</span>
      ${statNote}
      <button type="button" class="shop-btn ${worn ? "worn" : owned ? "own" : ""}">
        ${worn ? "wielding" : owned ? "equip" : `${item.price}&nbsp;c`}
      </button>`;
    renderPet(div.querySelector("canvas"), 2, item);
    div.querySelector(".shop-btn").addEventListener("click", () => {
      if (worn) {
        Profile.equipped[item.slot] = null;
      } else if (owned) {
        Profile.equipped[item.slot] = item.id;
        AudioEngine.beep(1047, 0.08, "triangle", 0.15);
      } else {
        if (Profile.coins < item.price) {
          AudioEngine.sfx("hurt");
          div.classList.add("nope");
          setTimeout(() => div.classList.remove("nope"), 350);
          return;
        }
        Profile.coins -= item.price;
        Profile.owned.push(item.id);
        Profile.equipped[item.slot] = item.id;
        AudioEngine.sfx("coin");
      }
      Profile.save();
      updateProfileUI();
      renderCloset();
      renderPetEverywhere();
    });
    grid.appendChild(div);
  });
}

/* ================= guild (classes) ================= */
function renderGuild() {
  const list = $("#class-list");
  list.innerHTML = "";
  CLASSES.forEach((c) => {
    const chosen = Profile.clazz === c.id;
    const div = document.createElement("div");
    div.className = "class-row" + (chosen ? " chosen" : "");
    div.innerHTML = `
      <div class="class-info">
        <span class="class-name">${c.name}</span>
        <span class="class-desc">${c.desc}</span>
      </div>
      <button type="button" class="shop-btn ${chosen ? "worn" : "own"}">${chosen ? "chosen" : "choose"}</button>`;
    div.querySelector("button").addEventListener("click", () => {
      if (Battle.active) return;
      Profile.clazz = c.id;
      Profile.save();
      AudioEngine.beep(1047, 0.08, "triangle", 0.15);
      renderGuild();
    });
    list.appendChild(div);
  });
}

/* ================= crew (friend codes + leaderboard) ================= */
const Crew = {
  makeCode() {
    const { l } = Profile.level();
    const payload = {
      v: 1,
      n: (Profile.name || "anon").slice(0, 12),
      l,
      s: Profile.stage,
      x: Profile.xp,
      c: Profile.clazz,
      t: Date.now(),
    };
    return "SNZ1." + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  },

  parseCode(code) {
    try {
      const raw = code.trim();
      if (!raw.startsWith("SNZ1.")) return null;
      const p = JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))));
      if (!p || p.v !== 1 || typeof p.n !== "string") return null;
      return {
        n: p.n.slice(0, 12),
        l: clamp(p.l | 0, 1, 999),
        s: clamp(p.s | 0, 1, STAGES.length),
        x: Math.max(0, p.x | 0),
        c: p.c,
        t: p.t | 0,
      };
    } catch { return null; }
  },

  addFriend(code) {
    const f = this.parseCode(code);
    if (!f) return false;
    // re-pasting a code updates that friend
    Profile.friends = Profile.friends.filter((x) => x.n.toLowerCase() !== f.n.toLowerCase());
    Profile.friends.push(f);
    Profile.friends = Profile.friends.slice(-20);
    Profile.save();
    return true;
  },

  render() {
    $("#crew-name").value = Profile.name;
    const me = { n: Profile.name || "you", l: Profile.level().l, s: Profile.stage, x: Profile.xp, me: true };
    const rows = [me, ...Profile.friends]
      .sort((a, b) => b.s - a.s || b.l - a.l || b.x - a.x);
    $("#leaderboard").innerHTML = rows.map((r, i) => `
      <li class="lb-row ${r.me ? "me" : ""}">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${escapeHtml(r.n)}</span>
        <span class="lb-stat">stg ${r.s} · lv ${r.l}</span>
      </li>`).join("");
  },
};

/* ================= alarms ================= */
const AlarmStore = {
  KEY: "snooze-fiend-alarms",
  list: [],

  load() {
    try {
      const raw = NATIVE ? AndroidBridge.getAlarms() : localStorage.getItem(this.KEY);
      this.list = JSON.parse(raw) || [];
    } catch { this.list = []; }
  },
  save() {
    const json = JSON.stringify(this.list);
    localStorage.setItem(this.KEY, json);
    if (NATIVE) AndroidBridge.syncAlarms(json); // persists natively and (re)schedules AlarmManager
  },

  add(time, label) {
    this.list.push({ id: Date.now() + "" + Math.floor(Math.random() * 999), time, label, on: true });
    this.list.sort((a, b) => a.time.localeCompare(b.time));
    this.save();
  },
  update(id, time, label) {
    const a = this.list.find((x) => x.id === id);
    if (a) { a.time = time; a.label = label; }
    this.list.sort((x, y) => x.time.localeCompare(y.time));
    this.save();
  },
  remove(id) { this.list = this.list.filter((a) => a.id !== id); this.save(); },
  toggle(id) {
    const a = this.list.find((x) => x.id === id);
    if (a) { a.on = !a.on; this.save(); }
  },
};

const TRASH_SVG = `<svg viewBox="0 0 16 16"><path fill="#8a5a3b" d="M6 1h4v1h3v2H3V2h3V1zM4 5h8v9h-1v1H5v-1H4V5zm2 2v5h1V7H6zm3 0v5h1V7H9z"/></svg>`;

function renderAlarms() {
  const ul = $("#alarm-list");
  ul.innerHTML = "";
  AlarmStore.list.forEach((a) => {
    const t = fmt12(a.time);
    const li = document.createElement("li");
    li.className = "alarm-row" + (a.on ? "" : " off");
    li.innerHTML = `
      <span class="alarm-time" title="tap to edit">${t.text}<span class="ampm">${t.ap}</span></span>
      <div class="alarm-meta">
        <span class="alarm-label">${a.label ? escapeHtml(a.label) : ""}</span>
        <span class="alarm-until">${a.on ? untilText(a.time) : ""}</span>
      </div>
      <button class="switch ${a.on ? "on" : ""}" title="toggle" aria-label="toggle alarm"></button>
      <button class="del-btn" title="delete" aria-label="delete alarm">${TRASH_SVG}</button>`;
    li.querySelector(".alarm-time").addEventListener("click", () => Picker.open(a.id));
    li.querySelector(".switch").addEventListener("click", () => { AlarmStore.toggle(a.id); renderAlarms(); });
    li.querySelector(".del-btn").addEventListener("click", () => { AlarmStore.remove(a.id); renderAlarms(); });
    ul.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ================= pixel time picker ================= */
const Picker = {
  h: 7, m: 0,
  editingId: null,

  open(alarmId = null) {
    this.editingId = alarmId;
    if (alarmId) {
      const a = AlarmStore.list.find((x) => x.id === alarmId);
      if (!a) return;
      const [h, m] = a.time.split(":").map(Number);
      this.h = h; this.m = m;
      $("#add-label").value = a.label || "";
      $("#picker-title").textContent = "edit alarm";
    } else {
      const soon = new Date(Date.now() + 60000);
      this.h = soon.getHours(); this.m = soon.getMinutes();
      $("#add-label").value = "";
      $("#picker-title").textContent = "new alarm";
    }
    this.render();
    this.renderCycleChips();
    $("#picker-overlay").hidden = false;
  },

  close() { $("#picker-overlay").hidden = true; },

  time() { return `${fmt(this.h)}:${fmt(this.m)}`; },

  render() {
    $("#pick-hour").textContent = fmt(this.h % 12 || 12);
    $("#pick-min").textContent = fmt(this.m);
    $("#pick-ampm").textContent = this.h < 12 ? "AM" : "PM";
    $("#pick-until").innerHTML = `rings <b>${untilText(this.time())}</b>`;
  },

  bump(t, d) {
    if (t === "h") this.h = (this.h + d + 24) % 24;
    else this.m = (this.m + d + 60) % 60;
    this.render();
    AudioEngine.beep(880, 0.03, "square", 0.05);
  },

  flipAmPm() {
    this.h = (this.h + 12) % 24;
    this.render();
    AudioEngine.beep(660, 0.05, "square", 0.08);
  },

  // sleep-cycle suggestions: fall asleep in ~15 min, then whole 90 min cycles
  renderCycleChips() {
    const chips = $("#cycle-chips");
    chips.innerHTML = "";
    [3, 4, 5, 6].forEach((n) => {
      const d = new Date(Date.now() + (15 + n * 90) * 60000);
      const h = d.getHours(), m = d.getMinutes();
      const t = fmt12(`${fmt(h)}:${fmt(m)}`);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "cycle-chip";
      chip.innerHTML = `<span class="cycle-time">${t.text}<small>${t.ap}</small></span><span class="cycle-n">${n} cycles</span>`;
      chip.addEventListener("click", () => {
        this.h = h; this.m = m;
        this.render();
        chips.querySelectorAll(".cycle-chip").forEach((c) => c.classList.remove("picked"));
        chip.classList.add("picked");
        AudioEngine.beep(1175, 0.05, "triangle", 0.1);
      });
      chips.appendChild(chip);
    });
  },

  save() {
    const label = $("#add-label").value.trim();
    if (this.editingId) AlarmStore.update(this.editingId, this.time(), label);
    else AlarmStore.add(this.time(), label);
    renderAlarms();
    this.close();
    AudioEngine.sfx("coin");
  },
};

/* ================= clock ================= */
let lastFired = "";
let lastCountdownMinute = "";

function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const t = fmt12(`${hh}:${mm}`);
  $("#big-time").innerHTML = `${t.text}<span id="big-ampm">${t.ap}</span>`;
  $("#big-date").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // keep the per-alarm "in Xh Ym" countdowns fresh
  if (`${hh}:${mm}` !== lastCountdownMinute) {
    lastCountdownMinute = `${hh}:${mm}`;
    renderAlarms();
  }

  const key = `${hh}:${mm}`;
  if (!Battle.active && !NATIVE) { // on Android, AlarmManager fires alarms instead
    const due = AlarmStore.list.find((a) => a.on && a.time === key && lastFired !== a.id + key);
    if (due) {
      lastFired = due.id + key;
      Battle.start(due.label || "WAKE UP", null, "alarm");
    }
  }
}

/* ================= battle ================= */
// base multiplier zones; the x3 zone widens with class/weapon bonuses
function buildZones(zoneBonus) {
  const mid = Math.min(0.5, 0.24 * (1 + zoneBonus));
  const rest = 1 - mid;
  return [
    { w: rest * 0.21, mult: 0.5 },
    { w: rest * 0.29, mult: 1 },
    { w: mid, mult: 3 },
    { w: rest * 0.29, mult: 1 },
    { w: rest * 0.21, mult: 0.5 },
  ];
}

// mini game pools: one is rolled at random every round, so each
// KO snooze cycles you into a different fight
const ATTACK_GAMES = ["meter", "mash", "combo"];
const DEFEND_GAMES = ["parry", "ring"];
const LANES = ["#meter", "#mash", "#combo", "#parry", "#ringlane"];
const TIPS = {
  meter: "stop the cursor in the x3 zone",
  mash: "mash! every click powers the attack",
  combo: "repeat the pattern: left and right clicks, or arrow keys",
  parry: "click the instant the arrows meet the diamond",
  ring: "click the moment the ring closes onto the diamond",
};

const ARROW_L = `<svg viewBox="0 0 14 18"><path fill="#5b3a29" d="M10 0h4v2h-2v2h-2v2h-2v2h2v2h2v2h2v2h-4v-2H8v-2H6v-2H4V8h2V6h2V4h2V2h2z"/></svg>`;
const ARROW_R = `<svg viewBox="0 0 14 18"><path fill="#5b3a29" d="M10 0h4v2h-2v2h-2v2h-2v2h2v2h2v2h2v2h-4v-2H8v-2H6v-2H4V8h2V6h2V4h2V2h2z" transform="scale(-1,1) translate(-14,0)"/></svg>`;

function pickGame(pool, last) {
  const options = pool.filter((g) => g !== last);
  return options[Math.floor(Math.random() * options.length)];
}

const Battle = {
  active: false,
  phase: "idle",          // banner | attack | defend | resolve | won
  game: null,             // which mini game is live this round
  kind: "test",           // alarm | pomo | test (decides rewards)
  lastAttack: null, lastDefend: null,
  phaseStart: 0,
  raf: 0,
  youHP: 60, youMax: 60,
  foeHP: 70, foeMax: 70,
  meterPeriod: 1150,
  parryTravel: 1400,
  mashWindow: 2200,
  comboWindow: 3600,
  mashCount: 0,
  comboSeq: [], comboIdx: 0,
  awaitingInput: false,
  onEnd: null,
  fromNative: false,      // battle launched by a native Android alarm
  stats: { crits: 0, parries: 0, kos: 0 },
  pendingReward: null,
  mods: { ...BASE_MODS },
  zones: buildZones(0),
  stageDef: STAGES[0],

  start(title, onEnd, kind = "test") {
    this.active = true;
    this.onEnd = onEnd || null;
    this.kind = kind;
    this.stats = { crits: 0, parries: 0, kos: 0 };
    this.mods = Profile.mods();
    this.zones = buildZones(this.mods.zoneBonus);
    this.stageDef = STAGES[Profile.stage - 1];

    // stage scaling: tougher enemy, slightly tougher you, faster mini games
    const sp = this.stageDef.speed;
    this.foeMax = this.stageDef.hp;
    this.youMax = 60 + (Profile.stage - 1) * 10;
    this.youHP = this.youMax; this.foeHP = this.foeMax;
    this.meterPeriod = 1150 / sp;
    this.parryTravel = 1400 / sp;
    this.mashWindow = 2200 / sp;
    this.comboWindow = 3600 / sp * this.mods.comboWindowMult;

    // zone widths in the meter UI
    const zoneEls = document.querySelectorAll("#meter .zone");
    this.zones.forEach((z, i) => { zoneEls[i].style.width = (z.w * 100) + "%"; });

    renderPet($("#spr-you"), 8);
    renderPet($("#mini-you"), 1);
    drawSprite($("#spr-foe"), this.stageDef.map, 8, 0, 6);
    drawSprite($("#mini-foe"), this.stageDef.map, 1, 0, 2);

    $("#bwin-name").textContent = title.toUpperCase().slice(0, 18) + "  R-0" + (1 + Math.floor(Math.random() * 9));
    $("#stage-chip").textContent = "STG " + Profile.stage;
    $("#battle-screen").hidden = false;
    $("#victory").hidden = true;
    $("#clock-screen").style.display = "none";
    this.updateBars();
    if (!this.fromNative) AudioEngine.startSiren(); // native alarms ring through Android's alarm stream
    this.banner(`${this.stageDef.name}\nBLOCKS YOUR MORNING!`, 1600, () => this.beginAttack());
    this.loop();
  },

  end() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    AudioEngine.stopSiren();
    $("#battle-screen").hidden = true;
    $("#victory").hidden = true;
    $("#clock-screen").style.display = "";
    if (this.fromNative && NATIVE && AndroidBridge.closeBattle) {
      try { AndroidBridge.closeBattle(); } catch { /* older shell */ }
    }
    this.fromNative = false;
    const cb = this.onEnd;
    this.onEnd = null;
    if (cb) cb();
  },

  hideLanes() {
    LANES.forEach((s) => { $(s).hidden = true; });
    $("#track-tip").textContent = "";
  },

  banner(text, ms, next) {
    this.phase = "banner";
    const b = $("#banner");
    b.textContent = text;
    b.hidden = false;
    setTimeout(() => { b.hidden = true; next && next(); }, ms);
  },

  /* ---- attack phase: random mini game ---- */
  beginAttack() {
    this.phase = "attack";
    this.game = pickGame(ATTACK_GAMES, this.lastAttack);
    this.lastAttack = this.game;
    this.phaseStart = performance.now();
    this.awaitingInput = true;
    this.hideLanes();
    $("#track-tip").textContent = TIPS[this.game];

    if (this.game === "meter") {
      $("#meter").hidden = false;
    } else if (this.game === "mash") {
      this.mashCount = 0;
      $("#mash-count").textContent = "0";
      $("#mash").hidden = false;
    } else if (this.game === "combo") {
      this.comboSeq = Array.from({ length: 5 }, () => (Math.random() < 0.5 ? "L" : "R"));
      this.comboIdx = 0;
      this.renderCombo();
      $("#combo").hidden = false;
    }
  },

  meterPos(t) {
    const u = ((t - this.phaseStart) % (this.meterPeriod * 2)) / this.meterPeriod;
    return u < 1 ? u : 2 - u;
  },

  renderCombo() {
    $("#combo-seq").innerHTML = this.comboSeq
      .map((d, i) => {
        const cls = i < this.comboIdx ? "done" : i === this.comboIdx ? "cur" : "";
        return `<span class="combo-chip ${cls}">${d === "L" ? ARROW_L : ARROW_R}</span>`;
      })
      .join("");
  },

  resolveMeter() {
    const pos = this.meterPos(performance.now());
    let acc = 0, mult = 0.5;
    for (const z of this.zones) {
      if (pos <= acc + z.w) { mult = z.mult; break; }
      acc += z.w;
    }
    this.landAttack(Math.round((rand(8, 12) + this.mods.atkFlat) * mult), mult === 3);
  },

  resolveMash() {
    const dmg = Math.round(Math.min(this.mashCount, this.mods.mashCap) * rand(1.7, 2.1) + this.mods.atkFlat);
    this.landAttack(dmg, this.mashCount >= 12);
  },

  resolveCombo(complete) {
    this.landAttack(
      complete ? Math.round(rand(22, 30) + this.mods.atkFlat) : this.comboIdx * 3,
      complete
    );
  },

  landAttack(dmg, crit) {
    this.awaitingInput = false;
    this.phase = "resolve";
    this.hideLanes();
    if (crit) dmg = Math.round(dmg * this.mods.critMult);

    const you = document.querySelector(".sprite-slot.you");
    you.classList.remove("lunge"); void you.offsetWidth; you.classList.add("lunge");
    setTimeout(() => {
      if (dmg <= 0) {
        AudioEngine.sfx("hurt");
        this.float("WHIFF", 0.72, "");
      } else {
        if (crit) this.stats.crits++;
        AudioEngine.sfx(crit ? "crit" : "hit");
        this.foeHP = clamp(this.foeHP - dmg, 0, this.foeMax);
        this.float(`${crit ? "CRIT " : ""}-${dmg}`, 0.72, crit ? "crit" : "");
        this.hurt(".sprite-slot.foe");
        if (crit) this.shake();
      }
      this.updateBars();
      if (this.foeHP <= 0) return this.win();
      setTimeout(() => this.beginDefend(), 650);
    }, 180);
  },

  /* ---- defend phase: random mini game ---- */
  beginDefend() {
    this.phase = "defend";
    this.game = pickGame(DEFEND_GAMES, this.lastDefend);
    this.lastDefend = this.game;
    this.phaseStart = performance.now();
    this.awaitingInput = true;
    this.hideLanes();
    $("#track-tip").textContent = TIPS[this.game];

    if (this.game === "parry") {
      $("#parry").hidden = false;
      $("#parry-diamond").classList.remove("hit");
    } else {
      $("#ringlane").hidden = false;
      $("#ring-target").classList.remove("hit");
    }
  },

  resolveDefend(timedOut = false) {
    this.awaitingInput = false;
    this.phase = "resolve";
    const err = timedOut ? 9999 : Math.abs(performance.now() - this.phaseStart - this.parryTravel);
    const diamond = this.game === "parry" ? $("#parry-diamond") : $("#ring-target");
    this.hideLanes();

    const foe = document.querySelector(".sprite-slot.foe");
    foe.classList.remove("lunge"); void foe.offsetWidth; foe.classList.add("lunge");

    setTimeout(() => {
      if (err <= this.mods.parryWindow) {
        this.stats.parries++;
        AudioEngine.sfx("parry");
        diamond.classList.add("hit");
        this.float("PARRY!", 0.28, "crit");
        const counter = Math.round(rand(4, 7) * this.mods.counterMult);
        this.foeHP = clamp(this.foeHP - counter, 0, this.foeMax);
        this.float(`-${counter}`, 0.72, "");
        this.hurt(".sprite-slot.foe");
      } else {
        const half = err <= this.mods.parryWindow + 110;
        const [lo, hi] = this.stageDef.dmg;
        const dmg = Math.round(rand(lo, hi) * (half ? 0.5 : 1) * this.mods.dmgTakenMult);
        AudioEngine.sfx("hurt");
        this.youHP = clamp(this.youHP - dmg, 0, this.youMax);
        this.float(half ? `blocked -${dmg}` : `-${dmg}`, 0.28, "");
        this.hurt(".sprite-slot.you");
        this.shake();
      }
      this.updateBars();
      if (this.foeHP <= 0) return this.win();
      if (this.youHP <= 0) return this.ko();
      setTimeout(() => this.beginAttack(), 650);
    }, 180);
  },

  ko() {
    this.stats.kos++;
    AudioEngine.sfx("ko");
    AudioEngine.escalate();
    if (this.fromNative && NATIVE) AndroidBridge.fiendHealed(); // native siren gets louder
    this.banner("KO! THE ENEMY HEALS\nWHILE YOU DOZE...", 1800, () => {
      this.youHP = this.youMax;
      this.foeHP = this.foeMax;
      this.updateBars();
      this.float("+FULL", 0.72, "heal");
      this.beginAttack();
    });
  },

  computeReward() {
    const base = { alarm: { xp: 30, c: 10 }, pomo: { xp: 15, c: 5 }, test: { xp: 5, c: 2 } }[this.kind];
    const stageMult = 1 + 0.25 * (Profile.stage - 1);
    const skill = this.stats.crits + this.stats.parries;
    let xp = (base.xp + skill * 8) * stageMult;
    let coins = (base.c + skill * 3) * stageMult * this.mods.coinMult;
    if (this.kind === "alarm" && this.stats.kos === 0) xp += 15; // flawless morning
    return { xp: Math.round(xp), coins: Math.round(coins) };
  },

  win() {
    this.phase = "won";
    AudioEngine.stopSiren();
    if (this.fromNative && NATIVE) AndroidBridge.alarmDefeated(); // silence the native ringtone immediately
    AudioEngine.sfx("win");
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("div");
      s.className = "spark";
      s.style.left = rand(10, 90) + "vw";
      s.style.top = rand(5, 35) + "vh";
      s.style.animationDelay = rand(0, 0.5) + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
    this.pendingReward = this.computeReward();
    setTimeout(() => this.showVictory(), 1000);
  },

  showVictory() {
    const r = this.pendingReward;
    $("#victory-sub").textContent = {
      alarm: "The enemy fainted. Prove you're actually up:",
      pomo: "Timer conquered. On to the next stretch:",
      test: "Training complete. Tiny rewards for the effort:",
    }[this.kind];
    $("#reward-xp").textContent = `+${r.xp} xp`;
    $("#reward-coins").textContent = `+${r.coins}`;

    // stage pips only move on flawless real-alarm wins
    const pipEl = $("#victory-pip");
    if (this.kind === "alarm" && Profile.stage < STAGES.length) {
      pipEl.hidden = false;
      pipEl.textContent = this.stats.kos === 0
        ? `flawless dawn! stage progress +1 (${Profile.pips + 1}/${this.stageDef.pips})`
        : "no stage progress: it caught you snoozing";
    } else {
      pipEl.hidden = true;
    }

    $("#claim-btn").textContent = { alarm: "I'M UP!", pomo: "CLAIM", test: "CLAIM" }[this.kind];
    $("#victory").hidden = false;
  },

  claim() {
    const r = this.pendingReward;
    this.pendingReward = null;
    $("#victory").hidden = true;
    const leveled = Profile.addRewards(r.xp, r.coins);

    // stage advancement: only flawless alarm wins count, and each stage needs more
    let stagedUp = false;
    if (this.kind === "alarm" && this.stats.kos === 0 && Profile.stage < STAGES.length) {
      Profile.pips++;
      if (Profile.pips >= this.stageDef.pips) {
        Profile.stage++;
        Profile.pips = 0;
        stagedUp = true;
      }
      Profile.save();
    }

    AudioEngine.sfx("coin");
    updateProfileUI();
    renderCloset();
    Crew.render();

    const finish = () => this.end();
    if (stagedUp) {
      AudioEngine.sfx("stageup");
      this.banner(`STAGE UP!\nNOW HUNTING:\n${STAGES[Profile.stage - 1].name}`, 2200, () => {
        if (leveled) {
          AudioEngine.sfx("levelup");
          this.banner(`LEVEL UP!\nKIKO IS NOW LV ${Profile.level().l}`, 1600, finish);
        } else finish();
      });
    } else if (leveled) {
      AudioEngine.sfx("levelup");
      this.banner(`LEVEL UP!\nKIKO IS NOW LV ${Profile.level().l}`, 1600, finish);
    } else {
      finish();
    }
  },

  /* ---- input; side is "L", "R", or null (space / untargeted click) ---- */
  input(side = null) {
    if (!this.active || !this.awaitingInput) return;

    if (this.phase === "attack") {
      if (this.game === "meter") return this.resolveMeter();
      if (this.game === "mash") {
        this.mashCount++;
        $("#mash-count").textContent = this.mashCount;
        AudioEngine.beep(560 + this.mashCount * 18, 0.04, "square", 0.08);
        return;
      }
      if (this.game === "combo") {
        if (!side) return; // combo needs a direction
        if (side === this.comboSeq[this.comboIdx]) {
          this.comboIdx++;
          AudioEngine.beep(660 + this.comboIdx * 80, 0.05, "square", 0.12);
          this.renderCombo();
          if (this.comboIdx >= this.comboSeq.length) this.resolveCombo(true);
        } else {
          AudioEngine.sfx("hurt");
          this.comboIdx = 0;
          this.renderCombo();
          this.shake();
        }
        return;
      }
    } else if (this.phase === "defend") {
      this.resolveDefend();
    }
  },

  /* ---- per-frame track animation ---- */
  loop() {
    const step = (t) => {
      if (!this.active) return;
      if (this.phase === "attack") {
        if (this.game === "meter") {
          $("#meter-cursor").style.left = (this.meterPos(t) * 100).toFixed(2) + "%";
        } else if (this.game === "mash") {
          const q = (t - this.phaseStart) / this.mashWindow;
          $("#mash-timer").style.width = clamp(100 - q * 100, 0, 100) + "%";
          if (q >= 1 && this.awaitingInput) this.resolveMash();
        } else if (this.game === "combo") {
          const q = (t - this.phaseStart) / this.comboWindow;
          $("#combo-timer").style.width = clamp(100 - q * 100, 0, 100) + "%";
          if (q >= 1 && this.awaitingInput) this.resolveCombo(false);
        }
      } else if (this.phase === "defend") {
        const q = (t - this.phaseStart) / this.parryTravel;
        if (this.game === "parry") {
          const l = $("#parry-l"), r = $("#parry-r");
          l.style.left = clamp(2 + q * 42, 2, 44) + "%";
          r.style.right = clamp(2 + q * 42, 2, 44) + "%";
        } else {
          const s = Math.max(10, 150 - q * 124); // shrinks onto the 26px diamond
          const o = $("#ring-outline");
          o.style.width = s + "px";
          o.style.height = s + "px";
        }
        if (q > 1.22 && this.awaitingInput) this.resolveDefend(true);
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },

  /* ---- presentation ---- */
  updateBars() {
    const y = $("#hp-you"), f = $("#hp-foe");
    y.style.width = (this.youHP / this.youMax * 100) + "%";
    f.style.width = (this.foeHP / this.foeMax * 100) + "%";
    y.classList.toggle("low", this.youHP / this.youMax < 0.3);
  },

  float(text, xFrac, cls) {
    const el = document.createElement("div");
    el.className = "floater " + cls;
    el.textContent = text;
    el.style.left = (xFrac * 100 - 8) + "%";
    el.style.top = "34%";
    $("#floaters").appendChild(el);
    setTimeout(() => el.remove(), 900);
  },

  hurt(sel) {
    const el = document.querySelector(sel);
    el.classList.remove("hurt"); void el.offsetWidth; el.classList.add("hurt");
  },

  shake() {
    const w = $("#bwin");
    w.classList.remove("shake"); void w.offsetWidth; w.classList.add("shake");
  },
};

/* ================= pomodoro ================= */
const Pomo = {
  KEY: "snooze-fiend-pomo",
  mode: "focus",        // focus | break
  running: false,
  endAt: 0,             // wall-clock ms when the current segment ends
  remaining: 25 * 60,   // seconds, used while paused
  workMin: 25,
  breakMin: 5,

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY));
      if (s) { this.workMin = s.workMin || 25; this.breakMin = s.breakMin || 5; }
    } catch { /* defaults */ }
    this.remaining = this.workMin * 60;
    $("#pomo-work").value = this.workMin;
    $("#pomo-break").value = this.breakMin;
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify({ workMin: this.workMin, breakMin: this.breakMin })); },

  startPause() {
    if (this.running) {
      this.remaining = Math.max(0, Math.round((this.endAt - Date.now()) / 1000));
      this.running = false;
    } else {
      this.endAt = Date.now() + this.remaining * 1000;
      this.running = true;
    }
    this.render();
  },

  reset() {
    this.running = false;
    this.mode = "focus";
    this.remaining = this.workMin * 60;
    this.render();
  },

  tick() {
    if (!this.running) return;
    const left = Math.max(0, Math.round((this.endAt - Date.now()) / 1000));
    if (left <= 0 && !Battle.active) {
      this.running = false;
      if (this.mode === "focus") {
        Battle.start("FOCUS DONE", () => {
          this.mode = "break";
          this.remaining = this.breakMin * 60;
          this.endAt = Date.now() + this.remaining * 1000;
          this.running = true;
          this.render();
        }, "pomo");
      } else {
        Battle.start("BREAK OVER", () => {
          this.mode = "focus";
          this.remaining = this.workMin * 60;
          this.endAt = Date.now() + this.remaining * 1000;
          this.running = true;
          this.render();
        }, "pomo");
      }
    }
    this.render();
  },

  render() {
    const secs = this.running
      ? Math.max(0, Math.round((this.endAt - Date.now()) / 1000))
      : this.remaining;
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    $("#pomo-time").textContent = `${m}:${s}`;

    const tag = $("#pomo-mode");
    tag.className = "pomo-mode " + (this.running ? this.mode : "");
    tag.textContent = this.running ? this.mode : (secs === this.workMin * 60 && this.mode === "focus" ? "ready" : "paused");

    $("#pomo-start").textContent = this.running ? "pause" : (this.mode === "focus" ? "start focus" : "start break");
  },
};

/* ================= wire up ================= */
function init() {
  Profile.load();
  renderPetEverywhere();
  $("#pet-idle").style.animation = "sunbob 2s steps(2) infinite";

  AlarmStore.load();
  renderAlarms();
  updateProfileUI();
  renderCloset();
  renderGuild();
  Crew.render();

  // picker
  $("#new-alarm-btn").addEventListener("click", () => Picker.open());
  $("#picker-overlay").addEventListener("pointerdown", (e) => {
    if (e.target === e.currentTarget) Picker.close(); // tap the backdrop to dismiss
  });
  $("#pick-cancel").addEventListener("click", () => Picker.close());
  $("#pick-set").addEventListener("click", () => Picker.save());
  $("#pick-ampm").addEventListener("click", () => Picker.flipAmPm());

  // steppers: tap to bump, hold to spin
  document.querySelectorAll(".pick-btn").forEach((b) => {
    let delay = null, repeat = null;
    const fire = () => Picker.bump(b.dataset.t, parseInt(b.dataset.d, 10));
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      fire();
      delay = setTimeout(() => { repeat = setInterval(fire, 90); }, 420);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
      b.addEventListener(ev, () => { clearTimeout(delay); clearInterval(repeat); }));
  });

  // crew
  $("#crew-name").addEventListener("change", (e) => {
    Profile.name = e.target.value.trim().slice(0, 12);
    Profile.save();
    Crew.render();
  });
  $("#code-copy").addEventListener("click", async () => {
    const code = Crew.makeCode();
    $("#code-out").value = code;
    $("#code-out").hidden = false;
    try {
      await navigator.clipboard.writeText(code);
      $("#code-copy").textContent = "copied!";
    } catch {
      $("#code-out").select?.();
      $("#code-copy").textContent = "long-press to copy";
    }
    setTimeout(() => { $("#code-copy").textContent = "share my code"; }, 1800);
  });
  $("#code-add").addEventListener("click", () => {
    const ok = Crew.addFriend($("#code-input").value);
    if (ok) {
      $("#code-input").value = "";
      AudioEngine.sfx("coin");
      Crew.render();
    } else {
      AudioEngine.sfx("hurt");
      $("#code-input").classList.add("nope");
      setTimeout(() => $("#code-input").classList.remove("nope"), 350);
    }
  });

  $("#test-btn").addEventListener("click", () => Battle.start("TEST RUN", null, "test"));
  $("#claim-btn").addEventListener("click", () => Battle.claim());

  $("#battle-screen").addEventListener("pointerdown", (e) => {
    Battle.input(e.clientX < window.innerWidth / 2 ? "L" : "R");
  });
  document.addEventListener("keydown", (e) => {
    if (!Battle.active) return; // don't steal keys from text inputs
    if (e.code === "Space") { e.preventDefault(); Battle.input(); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); Battle.input("L"); }
    else if (e.code === "ArrowRight") { e.preventDefault(); Battle.input("R"); }
  });

  // pomodoro
  Pomo.load();
  Pomo.render();
  $("#pomo-start").addEventListener("click", () => Pomo.startPause());
  $("#pomo-reset").addEventListener("click", () => Pomo.reset());
  $("#pomo-work").addEventListener("change", (e) => {
    Pomo.workMin = clamp(parseInt(e.target.value, 10) || 25, 1, 120);
    e.target.value = Pomo.workMin;
    Pomo.save();
    if (!Pomo.running && Pomo.mode === "focus") { Pomo.remaining = Pomo.workMin * 60; Pomo.render(); }
  });
  $("#pomo-break").addEventListener("change", (e) => {
    Pomo.breakMin = clamp(parseInt(e.target.value, 10) || 5, 1, 60);
    e.target.value = Pomo.breakMin;
    Pomo.save();
    if (!Pomo.running && Pomo.mode === "break") { Pomo.remaining = Pomo.breakMin * 60; Pomo.render(); }
  });

  tickClock();
  setInterval(() => { tickClock(); Pomo.tick(); }, 500);
}

// called by the Android shell (AlarmActivity) once the page is ready
window.nativeStartBattle = (label) => {
  if (Battle.active) return;
  Battle.fromNative = true;
  Battle.start(label || "WAKE UP", null, "alarm");
};

init();
