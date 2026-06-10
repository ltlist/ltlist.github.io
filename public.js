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
  apiKey: "AIzaSyAVokJ_Wl3aITEhj6UPetF-MGQXKdv75S8",
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
const totalEl = document.getElementById("totalFaucets");

let allFaucets = [];

/* =====================
   SCORE
===================== */
function calcScore(f) {
  const likes = f.likes || 0;
  const dislikes = f.dislikes || 0;
  return likes * 3 - dislikes * 2;
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

  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  refreshUI();
}

/* =====================
   UI
===================== */
function refreshUI() {
  render(allFaucets);
  renderTrending();
  renderCoinStats();
  loadCoinFilter();

  if (totalEl) {
    totalEl.innerText = `📊 ${allFaucets.length} Faucets`;
  }
}

/* =====================
   CLICK
===================== */
function canClick(id) {
  const key = "click_" + id;
  const now = Date.now();
  const last = localStorage.getItem(key);

  if (last && now - last < 5000) return false;
  localStorage.setItem(key, now);
  return true;
}

window.visitFaucet = async function (id, url) {

  if (!canClick(id)) return;

  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1)
    });
  } catch {}

  window.open(url, "_blank");
};

/* =====================
   LIKE / DISLIKE
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
   RENDER CARD (NEW STYLE FIX MOBILE)
===================== */
function render(data) {

  listDiv.innerHTML = data.map(d => `
    <div class="card">

      <div class="top-row">
        <div class="rank">#${d.rank || "-"}</div>
        <div class="coin">${d.coin || "-"}</div>
        <div class="score">⭐ ${calcScore(d)}</div>
      </div>

      <div class="name">${d.name}</div>

      <div class="bottom-row">
        <div class="vote">👍 ${d.likes || 0} 👎 ${d.dislikes || 0}</div>

        <a class="visit-btn"
           href="#"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>
      </div>

    </div>
  `).join("");
}

/* =====================
   TRENDING
===================== */
function renderTrending() {

  if (!trendingDiv) return;

  const top = [...allFaucets]
    .slice(0, 5);

  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank-badge">🔥 ${i + 1}</div>
      <div class="name">${d.name}</div>
      <div class="coin">${d.coin}</div>

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>
    </div>
  `).join("");
}

/* =====================
   COIN FILTER
===================== */
function loadCoinFilter() {

  if (!coinFilter) return;

  coinFilter.innerHTML = `<option value="all">All Coins</option>`;

  const coins = [...new Set(allFaucets.map(f => f.coin))];

  coins.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    coinFilter.appendChild(opt);
  });
}

/* =====================
   STATS
===================== */
function renderCoinStats() {

  if (!coinStatsDiv) return;

  const count = {};

  allFaucets.forEach(f => {
    count[f.coin] = (count[f.coin] || 0) + 1;
  });

  coinStatsDiv.innerHTML =
    Object.keys(count)
      .map(c => `<span class="badge">${c} (${count[c]})</span>`)
      .join("");
}

/* =====================
   INIT
===================== */
loadFaucets();