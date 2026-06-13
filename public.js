import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3iATEhj6UPetF-KXKDV75S8", // Ganti punyamu
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

const API_URL = "https://api.ltlist.workers.dev"; // GANTI URL WORKER KAMU

let allFaucets = [];

async function loadFaucets() {
  // KUNCI: Cuma where doang, gak pake orderBy. Biar gak perlu index
  const q = query(
    collection(db, "faucets"),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  allFaucets = snap.docs.map(d => ({ id: d.id,...d.data() }));

  // KUNCI: Urut manual di browser by clicks paling banyak
  allFaucets.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

// Klik Claim -> Nembak ke Worker biar anti spam 60mnt
window.visitFaucet = async function (id, url) {
  try {
    const res = await fetch(`${API_URL}/api/click`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id})
    });
    const data = await res.json();

    if(!res.ok){
      alert(data.error); // "Tunggu 42 menit lagi"
      return;
    }
  } catch (e) {
    console.log(e);
    alert("Gagal connect server");
    return;
  }

  window.open(url, "_blank");
  loadFaucets(); // Refresh biar clicks naik
}

function render(data) {
  if (!listDiv) return;
  listDiv.innerHTML = data.map(d => `
    <div class="card">
      <div class="rank">#${d.rank || "-"}</div>
      <div class="info">
        <div class="name">${d.name || "-"}</div>
        <div class="meta">${d.coin || "-"} 💧 ${d.clicks || 0}</div> <!-- UPTIME UDAH DIBUANG -->
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">Claim</button>
    </div>
  `).join("");
}

function renderTrending() {
  if (!trendingDiv) return;
  const top = allFaucets.slice(0, 3); // Udah urut dari atas
  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank">🔥 ${i + 1}</div>
      <div class="info">
        <div class="name">${d.name}</div>
        <div class="meta">${d.coin} 💧 ${d.clicks || 0}</div> <!-- UPTIME UDAH DIBUANG -->
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.url}')">Claim</button>
    </div>
  `).join("");
}

function renderTotal() {
  if (!totalEl) return;
  totalEl.innerText = `📊 ${allFaucets.length} Active Faucets`;
}

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