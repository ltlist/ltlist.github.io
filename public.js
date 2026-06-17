const API_URL = "https://api.ltlist.workers.dev"; // URL Worker kamu buat /api/click
const CARDS_URL = "https://ltlist.github.io/cards.json"; // <-- INI KUNCINYA

const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");
const totalEl = document.getElementById("totalFaucets");

let allFaucets = [];

async function loadFaucets() {
  // HAPUS SEMUA FIREBASE. GANTI JADI FETCH CARDS.JSON
  const res = await fetch(CARDS_URL + '?t=' + Date.now()); // +t biar gak ke-cache
  if (!res.ok) {
    listDiv.innerHTML = `<p style="color:red">Gagal load data</p>`;
    return;
  }
  allFaucets = await res.json();

  // Urut manual by clicks paling banyak
  allFaucets.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

// Klik Claim -> Nembak ke Worker biar anti spam 60mnt
window.visitFaucet = async function (id, url) {
  const btn = document.querySelector(`button[onclick*="${id}"]`);
  if(btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const res = await fetch(`${API_URL}/api/click`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id})
    });
    const data = await res.json();

    if(!res.ok){
      alert(data.error); // "Tunggu 42 menit lagi"
      if(btn) { btn.disabled = false; btn.textContent = 'Claim'; }
      return;
    }
    
    // Update local biar rank langsung geser tanpa reload
    const item = allFaucets.find(f => f.id === id);
    if(item) {
      item.clicks = (item.clicks || 0) + 1;
      allFaucets.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    }
    
    render(allFaucets); 
    renderTrending();
    renderCoinStats();

  } catch (e) {
    console.log(e);
    alert("Gagal connect server");
  }

  window.open(url, "_blank");
  if(btn) { setTimeout(() => { btn.disabled = false; btn.textContent = 'Claim'; }, 1500); }
}

function render(data) {
  if (!listDiv) return;
  // MAP FIELD: admin pake `title, link`, public pake `name, url`
  listDiv.innerHTML = data.map((d, i) => `
    <div class="card">
      <div class="rank">#${i + 1}</div>
      <div class="info">
        <div class="name">${d.title || d.name || "-"}</div>
        <div class="meta">${d.coin || "-"} 💧 ${d.clicks || 0}</div>
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.link || d.url}')">Claim</button>
    </div>
  `).join("");
}

function renderTrending() {
  if (!trendingDiv) return;
  const top = allFaucets.slice(0, 3);
  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank">🔥 ${i + 1}</div>
      <div class="info">
        <div class="name">${d.title || d.name}</div>
        <div class="meta">${d.coin} 💧 ${d.clicks || 0}</div>
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.id}','${d.link || d.url}')">Claim</button>
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
    (f.title || f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  ));
};

window.filterCoin = function () {
  const c = coinFilter?.value;
  if (!c || c === "all") return render(allFaucets);
  render(allFaucets.filter(f => f.coin === c));
};

loadFaucets();