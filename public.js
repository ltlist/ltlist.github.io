import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");

let allFaucets = [];

/* =====================
   DEVICE ID
===================== */
function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

/* =====================
   SCORE SYSTEM
===================== */
function calcScore(f) {
  return (f.clicks || 0) + (f.likes || 0) * 2 - (f.dislikes || 0) * 2;
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    allFaucets.push({ id: d.id, ...d.data() });
  });

  // SORT BY SCORE (AUTO RANK)
  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  loadCoinFilter();
  renderTotal();
}

/* =====================
   TOTAL FAUCET
===================== */
function renderTotal() {
  const el = document.getElementById("totalFaucets");
  if (el) el.innerText = `📊 ${allFaucets.length} Faucets`;
}

/* =====================
   CLICK ANTI SPAM
===================== */
window.visitFaucet = async function (id, url) {

  const key = "click_" + id;
  const now = Date.now();
  const last = localStorage.getItem(key);

  if (last && now - last < 5000) return; // anti spam 5 detik

  localStorage.setItem(key, now);

  await updateDoc(doc(db, "faucets", id), {
    clicks: increment(1)
  });

  window.open(url, "_blank");
};

/* =====================
   LIKE / DISLIKE (ANTI DUPLICATE)
===================== */
window.likeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);
  const ref = doc(db, "faucets", id);

  if (current === "like") return;

  if (current === "dislike") {
    await updateDoc(ref, {
      dislikes: increment(-1),
      likes: increment(1)
    });
  } else {
    await updateDoc(ref, {
      likes: increment(1)
    });
  }

  localStorage.setItem(key, "like");
  loadFaucets();
};

window.dislikeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);
  const ref = doc(db, "faucets", id);

  if (current === "dislike") return;

  if (current === "like") {
    await updateDoc(ref, {
      likes: increment(-1),
      dislikes: increment(1)
    });
  } else {
    await updateDoc(ref, {
      dislikes: increment(1)
    });
  }

  localStorage.setItem(key, "dislike");
  loadFaucets();
};

/* =====================
   RENDER LIST (MAIN)
===================== */
function render(data) {

  listDiv.innerHTML = data.map(d => `
    <div class="card">

      <div class="rank-badge">#${d.rank || "-"}</div>

      <div class="name">${d.name}</div>

      <div class="coin">${d.coin}</div>

      <div class="clicks">👁 ${d.clicks || 0}</div>

      <div class="clicks">⭐ ${calcScore(d)}</div>

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>

      <button onclick="likeFaucet('${d.id}')">👍</button>
      <button onclick="dislikeFaucet('${d.id}')">👎</button>

    </div>
  `).join("");
}

/* =====================
   TRENDING (TOP SCORE)
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => calcScore(b) - calcScore(a))
    .slice(0, 5);

  const el = document.getElementById("trending");
  if (!el) return;

  el.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank-badge">🔥 ${i + 1}</div>
      <div class="name">${d.name}</div>
      <div class="coin">${d.coin}</div>
      <div class="clicks">⭐ ${calcScore(d)}</div>

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>
    </div>
  `).join("");
}

/* =====================
   COIN FILTER (FIX ALL COIN)
===================== */
function loadCoinFilter() {

  const el = document.getElementById("coinFilter");
  if (!el) return;

  el.innerHTML = `<option value="all">All Coins</option>`;

  const coins = [...new Set(allFaucets.map(f => f.coin).filter(Boolean))];

  coins.sort();

  coins.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    el.appendChild(opt);
  });
}

/* =====================
   COIN STATS (ZER / BTC FIX)
===================== */
function renderCoinStats() {

  const el = document.getElementById("coinStats");
  if (!el) return;

  const count = {};

  allFaucets.forEach(f => {
    if (!f.coin) return;
    count[f.coin] = (count[f.coin] || 0) + 1;
  });

  el.innerHTML = Object.keys(count).sort().map(c =>
    `<span class="badge">${c} (${count[c]})</span>`
  ).join("");
}

/* =====================
   SEARCH + FILTER SUPPORT
===================== */
window.searchPublic = function () {

  const q = document.getElementById("search")?.value.toLowerCase() || "";

  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  ));
};

window.filterCoin = function () {

  const c = document.getElementById("coinFilter")?.value;

  if (!c || c === "all") return render(allFaucets);

  render(allFaucets.filter(f => f.coin === c));
};

/* =====================
   INIT
===================== */
loadFaucets();