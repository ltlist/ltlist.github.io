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
  apiKey: "AIzaSyAVokWj_Wj3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");
const totalDiv = document.getElementById("totalFaucets");

let allFaucets = [];

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    const data = d.data();

    if (data.status === "active") {
      allFaucets.push({
        id: d.id,
        ...data
      });
    }
  });

  // sort rank
  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  // UI update
  if (totalDiv) {
    totalDiv.innerHTML = `📊 ${allFaucets.length} Active Faucets`;
  }

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  loadCoinFilter();
}

/* =====================
   CLICK TRACKING
===================== */
window.visitFaucet = async function (id, url) {

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

  let html = "";

  data.forEach((d) => {

    html += `
      <div class="card">

        <div class="rank-badge">#${d.rank || "-"}</div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">👁 ${d.clicks || 0}</div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

/* =====================
   TRENDING (TOP CLICK)
===================== */
function renderTrending() {

  if (!trendingDiv) return;

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);

  let html = "";

  top.forEach((d, i) => {

    html += `
      <div class="card">

        <div class="rank-badge">🔥 ${i + 1}</div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">👁 ${d.clicks || 0}</div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>
    `;
  });

  trendingDiv.innerHTML = html;
}

/* =====================
   COIN STATS (FIX ALL COIN)
===================== */
function renderCoinStats() {

  if (!coinStatsDiv) return;

  const count = {};

  allFaucets.forEach(f => {
    const c = (f.coin || "UNKNOWN").trim();
    count[c] = (count[c] || 0) + 1;
  });

  let html = "";

  Object.keys(count)
    .sort()
    .forEach(coin => {
      html += `<span class="badge">${coin} (${count[coin]})</span>`;
    });

  coinStatsDiv.innerHTML = html;
}

/* =====================
   COIN FILTER (FIX BUG)
===================== */
function loadCoinFilter() {

  if (!coinFilter) return;

  coinFilter.innerHTML = `<option value="all">All Coins</option>`;

  const coins = [...new Set(allFaucets.map(f => (f.coin || "UNKNOWN").trim()))];

  coins.sort();

  coins.forEach(coin => {
    const opt = document.createElement("option");
    opt.value = coin;
    opt.textContent = coin;
    coinFilter.appendChild(opt);
  });
}

/* =====================
   SEARCH
===================== */
window.searchPublic = function () {

  const q = (document.getElementById("search")?.value || "").toLowerCase();

  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q)
  ));
};

/* =====================
   FILTER COIN
===================== */
window.filterCoin = function () {

  const val = coinFilter?.value;

  if (!val || val === "all") {
    render(allFaucets);
    return;
  }

  render(allFaucets.filter(f => f.coin === val));
};

/* =====================
   INIT
===================== */
loadFaucets();