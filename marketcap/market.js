/***********************
 * LTList MARKET STABLE
 * Anti Error + Fallback + Retry
 ***********************/

let coins = [];
let currentCoin = null;
let currentDays = 7;

/* =========================
   FALLBACK DATA (kalau API gagal)
========================= */
const fallbackCoins = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 0,
    price_change_percentage_24h: 0,
    market_cap: 0
  },
  {
    id: "ethereum",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 0,
    price_change_percentage_24h: 0,
    market_cap: 0
  }
];

/* =========================
   LOADING UI
========================= */
function showLoading() {
  document.getElementById("coinList").innerHTML =
    "<div style='padding:20px;color:#00ffcc'>Loading market...</div>";
}

/* =========================
   LOAD MARKET (ANTI ERROR)
========================= */
async function loadMarket(retry = 0) {

  showLoading();

  try {

    const url =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10&page=1&sparkline=false";

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error("Empty data");
    }

    coins = data;
    renderCoins();

  } catch (err) {

    console.log("Market error:", err);

    // retry max 3x
    if (retry < 3) {
      console.log("Retrying...", retry + 1);

      setTimeout(() => {
        loadMarket(retry + 1);
      }, 2000);

      return;
    }

    // fallback mode
    coins = fallbackCoins;
    renderCoins();

    document.getElementById("coinList").innerHTML +=
      "<div style='padding:10px;color:#ff4d4d'>⚠️ Offline / API fallback mode</div>";
  }
}

/* =========================
   RENDER COINS (SAFE)
========================= */
function renderCoins() {

  let html = "";

  coins.forEach(c => {

    let price = c.current_price ?? 0;
    let change = c.price_change_percentage_24h ?? 0;

    html += `
      <div class="coin-item" onclick="openChart('${c.id}','${c.name}')">

        <div class="coin-left">
          <img src="${c.image}" onerror="this.style.display='none'">

          <div>
            <div>${c.name}</div>
            <small>$${price.toLocaleString()}</small>
          </div>
        </div>

        <div style="color:${change>=0?'#00ff88':'#ff4d4d'}">
          ${change.toFixed(2)}%
        </div>

      </div>
    `;
  });

  document.getElementById("coinList").innerHTML = html;
}

/* =========================
   OPEN CHART
========================= */
async function openChart(id, name) {

  currentCoin = id;
  currentDays = 7;

  document.getElementById("chartModal").style.display = "block";

  document.getElementById("chartTitle").innerText = name;

  loadChart();
}

/* =========================
   TIMEFRAME
========================= */
function changeTF(days) {
  currentDays = days;
  loadChart();
}

/* =========================
   LOAD CHART (SAFE)
========================= */
async function loadChart(retry = 0) {

  try {

    const url =
      `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${currentDays}`;

    const res = await fetch(url);

    if (!res.ok) throw new Error("Chart API error");

    const data = await res.json();

    if (!data.prices) throw new Error("No chart data");

    let candles = createCandles(data.prices);

    drawChart(candles);

  } catch (err) {

    console.log("Chart error:", err);

    if (retry < 2) {
      setTimeout(() => loadChart(retry + 1), 2000);
      return;
    }

    document.getElementById("candleChart").getContext("2d")
      .fillText("Chart error / retry failed", 20, 50);
  }
}

/* =========================
   OHLC BUILDER
========================= */
function createCandles(prices) {

  let candles = [];
  let chunk = Math.max(1, Math.floor(prices.length / 20));

  for (let i = 0; i < prices.length; i += chunk) {

    let slice = prices.slice(i, i + chunk);
    if (!slice.length) continue;

    candles.push({
      open: slice[0][1],
      close: slice[slice.length - 1][1],
      high: Math.max(...slice.map(p => p[1])),
      low: Math.min(...slice.map(p => p[1]))
    });
  }

  return candles;
}

/* =========================
   DRAW CHART SAFE
========================= */
function drawChart(candles) {

  const canvas = document.getElementById("candleChart");
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 400;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (!candles || candles.length === 0) return;

  let max = Math.max(...candles.map(c=>c.high));
  let min = Math.min(...candles.map(c=>c.low));

  let step = canvas.width / candles.length;

  candles.forEach((c,i)=>{

    let x = i * step + step/2;

    let openY = canvas.height - ((c.open-min)/(max-min))*canvas.height;
    let closeY = canvas.height - ((c.close-min)/(max-min))*canvas.height;
    let highY = canvas.height - ((c.high-min)/(max-min))*canvas.height;
    let lowY = canvas.height - ((c.low-min)/(max-min))*canvas.height;

    ctx.strokeStyle = "#999";

    ctx.beginPath();
    ctx.moveTo(x,highY);
    ctx.lineTo(x,lowY);
    ctx.stroke();

    ctx.fillStyle = c.close>=c.open ? "#00ff88" : "#ff4d4d";

    ctx.fillRect(x-3,Math.min(openY,closeY),6,Math.abs(closeY-openY));
  });
}

/* =========================
   CLOSE CHART
========================= */
function closeChart(){
  document.getElementById("chartModal").style.display="none";
}

/* =========================
   INIT (SAFE START)
========================= */
window.addEventListener("load", () => {
  loadMarket();
});