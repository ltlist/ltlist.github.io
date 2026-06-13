import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokJ_Wj3iATEhj6UPetF-KXKDV75S8",
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

// IMPORTANT: tanpa slash di akhir
const API_URL = "https://misty-truth-00e3.cnamelist.workers.dev";

let allFaucets = [];

async function loadFaucets() {
  const q = query(
    collection(db, "faucets"),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);
  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  sortAndRender();
  renderTrending();
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

// =========================
// SORT + RENDER UTAMA
// =========================
function sortAndRender() {
  allFaucets.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  render(allFaucets);
}

// =========================
// CLICK SYSTEM (WORKER)
// =========================
window.visitFaucet = async function (id, url) {
  const btn = document.querySelector(`button[onclick*="${id}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "...";
  }

  try {
    const res = await fetch(`${API_URL}/api/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Claim";
      }
      return;
    }

    // ✔ FIX: pakai data server (bukan fake local)
    const item = allFaucets.find(f => f.id === id);
    if (item) {
      item.clicks = data.count;
      sortAndRender();
    }

    renderTrending();
    renderCoinStats();

  } catch (e) {
    console.log(e);
    alert("Gagal connect server");
  }

  window.open(url, "_blank");

  if (btn) {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Claim";
    }, 1200);
  }
};

// =========================
// RENDER LIST
// =========================
function render(data) {
  if (!listDiv) return;

  listDiv.innerHTML = data.map((d, i) => `
    <div class="card">
      <div class="rank">#${i + 1}</div>
      <div class="info">
        <div class="name">${d.name || "-"}</div>
        <div class="meta">${d.coin || "-"} 💧 ${d.clicks || 0}</div>
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">Claim</button>
    </div>
  `).join("");
}

// =========================
// TRENDING
// =========================
function renderTrending() {
  if (!trendingDiv) return;

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 3);

  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank">🔥 ${i + 1}</div>
      <div class="info">
        <div class="name">${d.name}</div>
        <div class="meta">${d.coin} 💧 ${d.clicks || 0}</div>
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">Claim</button>
    </div>
  `).join("");
}

// =========================
// TOTAL
// =========================
function renderTotal() {
  if (!totalEl) return;
  totalEl.innerText = `📊 ${allFaucets.length} Active Faucets`;
}

// =========================
// COIN STATS
// =========================
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

// =========================
// FILTER
// =========================
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

window.searchPublic = function () {
  const q = document.getElementById("search")?.value.toLowerCase() || "";
  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  ));
};

window.filterCoin = function () {
  const c = coinFilter?.value;
  if (!c || c === "all") return render(allFaucets);
  render(allFaucets.filter(f => f.coin === c));
};

loadFaucets();