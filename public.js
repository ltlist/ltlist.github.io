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
   FIREBASE CONFIG
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3iATEhj6UPetF-KXKDV75S8",
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
   DEVICE ID
===================== */
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

/* =====================
   ANTI CLICK SPAM 5 DETIK
===================== */
function canClick(id) {
  const last = localStorage.getItem("click_" + id);
  if (!last) return true;
  return Date.now() - Number(last) > 5000;
}

function setClick(id) {
  localStorage.setItem("click_" + id, Date.now());
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {
  const snap = await getDocs(collection(db, "faucets"));
  allFaucets = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status === "active") {
      allFaucets.push({ id: docSnap.id, ...data });
    }
  });
  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
  render(allFaucets);
  renderTrending();
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

/* =====================
   CLICK TRACK SAFE
===================== */
window.visitFaucet = async function (id, url) {
  if (!canClick(id)) return;
  setClick(id);
  const ref = doc(db, "faucets", id);
  try {
    const faucet = allFaucets.find(f => f.id === id);
    let updateData = {
      clicks: increment(1),
      lastClickAt: Date.now(),
      deviceId: getDeviceId()
    };
    if (faucet && typeof faucet.uptime !== "undefined") {
      updateData.uptime = increment(1);
    }
    await updateDoc(ref, updateData);
  } catch (e) {
    console.log(e);
  }
  window.open(url, "_blank");
};

/* =====================
   RENDER MAIN LIST - UDAH PAKE BUTTON
===================== */
function render(data) {
  if (!listDiv) return;
  listDiv.innerHTML = data.map(d => `
    <div class="card">
      <div class="rank">#${d.rank || "-"}</div>
      <div class="name">${d.name || "-"}</div>
      <div class="coin">${d.coin || "-"}</div>

      <div class="clicks">💧 ${d.clicks || 0}</div>
      <div class="uptime">⏱ ${d.uptime || 100}</div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </button>
    </div>
  `).join("");
}

/* =====================
   TRENDING - UDAH PAKE BUTTON
===================== */
function renderTrending() {
  if (!trendingDiv) return;
  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 3);
  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank">🔥 ${i + 1}</div>
      <div class="name">${d.name}</div>
      <div class="coin">${d.coin}</div>

      <div class="clicks">💧 ${d.clicks || 0}</div>
      <div class="uptime">⏱ ${d.uptime || 100}</div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </button>
    </div>
  `).join("");
}

/* =====================
   TOTAL
===================== */
function renderTotal() {
  if (!totalEl) return;
  totalEl.innerText = `📊 ${allFaucets.length} Active Faucets`;
}

/* =====================
   COIN STATS
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
   FILTER COIN
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
   FILTER
===================== */
window.filterCoin = function () {
  const c = coinFilter?.value;
  if (!c || c === "all") return render(allFaucets);
  render(allFaucets.filter(f => f.coin === c));
};

/* =====================
   INIT
===================== */
loadFaucets();