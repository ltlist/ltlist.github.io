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
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");

let allFaucets = [];

/* =====================
   SCORE SYSTEM (REAL PRO)
===================== */
function calcScore(f) {
  const clicks = f.clicks || 0;
  const likes = f.likes || 0;
  const dislikes = f.dislikes || 0;

  return (clicks * 1) + (likes * 3) - (dislikes * 4);
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
      allFaucets.push({
        id: d.id,
        ...data
      });
    }
  });

  // SORT BY SCORE (REAL PRO)
  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  loadCoinFilter();
}

/* =====================
   DEVICE CLICK + ANTI SPAM SIMPLE
===================== */
function getClickKey(id) {
  return "click_" + id;
}

function canClick(id) {
  const last = localStorage.getItem(getClickKey(id));
  const now = Date.now();

  if (last && now - last < 7000) return false; // 7 detik anti spam
  localStorage.setItem(getClickKey(id), now);
  return true;
}

/* =====================
   CLICK TRACK
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
   LIKE SYSTEM (ANTI DOUBLE)
===================== */
window.likeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);

  if (current === "like") return alert("Sudah like!");

  const ref = doc(db, "faucets", id);

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

/* =====================
   DISLIKE SYSTEM
===================== */
window.dislikeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);

  if (current === "dislike") return alert("Sudah dislike!");

  const ref = doc(db, "faucets", id);

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
   RENDER MAIN LIST
===================== */
function render(data) {

  let html = "";

  data.forEach((d) => {

    const score = calcScore(d);

    html += `
      <div class="card">

        <div class="rank-badge">#${d.rank || "-"}</div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">👁 ${d.clicks || 0}</div>

        <div class="clicks">⭐ ${score}</div>

        <div class="clicks">👍 ${d.likes || 0} 👎 ${d.dislikes || 0}</div>

        <a class="visit-btn"
           href="#"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

        <button onclick="likeFaucet('${d.id}')">👍</button>
        <button onclick="dislikeFaucet('${d.id}')">👎</button>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

/* =====================
   TRENDING (TOP SCORE)
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => calcScore(b) - calcScore(a))
    .slice(0, 5);

  let html = "";

  top.forEach((d, i) => {

    html += `
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
    `;
  });

  document.getElementById("trending").innerHTML = html;
}

/* =====================
   ALL COIN STATS (FIXED)
===================== */
function renderCoinStats() {

  const count = {};

  allFaucets.forEach(f => {
    const c = (f.coin || "UNKNOWN").trim();
    count[c] = (count[c] || 0) + 1;
  });

  let html = "";

  Object.keys(count).sort().forEach(coin => {
    html += `<span class="badge">${coin} (${count[coin]})</span>`;
  });

  coinStatsDiv.innerHTML = html;
}

/* =====================
   COIN FILTER (FIXED)
===================== */
function loadCoinFilter() {

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
   FILTER COIN
===================== */
window.filterCoin = function () {

  const val = coinFilter.value;

  if (val === "all") {
    render(allFaucets);
    return;
  }

  render(allFaucets.filter(f => f.coin === val));
};

/* =====================
   SEARCH
===================== */
window.searchPublic = function () {

  const q = document.getElementById("search").value.toLowerCase();

  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q)
  ));
};

/* =====================
   INIT
===================== */
loadFaucets();