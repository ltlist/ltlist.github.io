const CARDS_URL = "https://ltlist.github.io/cards.json"; // + ?t= biar gak ke-cache

const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");
const totalEl = document.getElementById("totalFaucets");

let allFaucets = [];

async function loadFaucets() {
  const res = await fetch(CARDS_URL + '?t=' + Date.now());
  if (!res.ok) return listDiv.innerHTML = `<p style="color:red">Gagal load data</p>`;
  
  allFaucets = await res.json();
  // GAK ADA SORT BY CLICKS LAGI. Urutan = urutan dari dashboard kamu

  render(allFaucets);
  renderTrending(); // Trending = 3 teratas dari dashboard
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

// Langsung buka link, tanpa /api/click
window.visitFaucet = function (url) {
  window.open(url, "_blank");
}

function render(data) {
  if (!listDiv) return;
  listDiv.innerHTML = data.map((d, i) => `
    <div class="card">
      <div class="rank">#${i + 1}</div>
      <div class="info">
        <div class="name">${d.title || d.name || "-"}</div>
        <div class="meta">${d.coin || "-"}</div> <!-- clicks dibuang -->
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.link || d.url}')">Claim</button> <!-- id dibuang -->
    </div>
  `).join("");
}

function renderTrending() {
  if (!trendingDiv) return;
  const top = allFaucets.slice(0, 3); // 3 teratas = yang kamu taruh paling atas di dashboard
  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank">🔥 ${i + 1}</div>
      <div class="info">
        <div class="name">${d.title || d.name}</div>
        <div class="meta">${d.coin}</div>
      </div>
      <button class="visit-btn" onclick="visitFaucet('${d.link || d.url}')">Claim</button>
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