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

/* =====================
   DOM
===================== */
const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");
const totalEl = document.getElementById("totalFaucets");

let allFaucets = [];

/* =====================
   SCORE SYSTEM (CLICK ONLY)
===================== */
function calcScore(f) {
  return (f.clicks || 0);
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    const data = d.data();

    if (data.status === "active") {
      allFaucets.push({ id: d.id, ...data });
    }
  });

  // AUTO RANK BY CLICK
  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  refreshUI();
}

/* =====================
   REFRESH UI
===================== */
function refreshUI() {
  render(allFaucets);
  renderTrending();
  renderCoinStats();
  loadCoinFilter();
  renderTotal();
}

/* =====================
   TOTAL
===================== */
function renderTotal() {
  if (totalEl) {
    totalEl.innerText = `📊 ${allFaucets.length} Faucets`;
  }
}

/* =====================
   ANTI SPAM CLICK (PRO SIMPLE)
===================== */
function canClick(id) {
  const key = "click_" + id;
  const now = Date.now();
  const last = localStorage.getItem(key);

  if (last && now - last < 7000) return false;
  localStorage.setItem(key, now);
  return true;
}

/* =====================
   VISIT / CLICK TRACK
===================== */
window.visitFaucet = async function (id, url) {

  if (!canClick(id)) return;

  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1)
    });
  } catch (e) {}

  window.open(url, "_blank");
};

/* =====================
   MAIN LIST
===================== */
function render(data) {

  if (!listDiv) return;

  listDiv.innerHTML = data.map(d => `
    <div class="card">

      <div class="rank-badge">#${d.rank || "-"}</div>

      <div class="name">${d.name || "-"}</div>

      <div class="coin">${d.coin || "UNKNOWN"}</div>

      <div class="clicks">👁 ${d.clicks || 0}</div>

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
   TRENDING
===================== */
function renderTrending() {

  if (!trendingDiv) return;

  const top = [...allFaucets]
    .sort((a, b) => calcScore(b) - calcScore(a))
    .slice(0, 5);

  trendingDiv.innerHTML = top.map((d, i) => `
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
   COIN STATS (FIXED)
===================== */
function renderCoinStats() {

  if (!coinStatsDiv) return;

  const count = {};

  allFaucets.forEach(f => {
    const c = (f.coin || "UNKNOWN").trim();
    count[c] = (count[c] || 0) + 1;
  });

  coinStatsDiv.innerHTML = Object.keys(count)
    .sort()
    .map(c => `<span class="badge">${c} (${count[c]})</span>`)
    .join("");
}

/* =====================
   COIN FILTER
===================== */
function loadCoinFilter() {

  if (!coinFilter) return;

  coinFilter.innerHTML = `<option value="all">All Coins</option>`;

  const coins = [...new Set(allFaucets.map(f => (f.coin || "UNKNOWN").trim()))];

  coins.sort();

  coins.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    coinFilter.appendChild(opt);
  });
}

/* =====================
   FILTER
===================== */
window.filterCoin = function () {

  const v = coinFilter?.value;

  if (!v || v === "all") return render(allFaucets);

  render(allFaucets.filter(f => f.coin === v));
};

/* =====================
   SEARCH
===================== */
window.searchPublic = function () {

  const q = document.getElementById("search")?.value.toLowerCase() || "";

  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  ));
};

/* =====================
   INIT
===================== */
loadFaucets();