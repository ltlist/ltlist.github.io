/***********************
 * LTList MARKET PRO AI
 * Candlestick + RSI + MA + AI Prediction + WS
 ***********************/

let coins = [];
let favorites = JSON.parse(localStorage.getItem("fav")) || [];

let currentCoin = null;
let currentName = "";
let currentDays = 7;

/* =========================
   MARKET DATA
========================= */
async function loadMarket() {

  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,dogecoin,solana,ripple,cardano,tron,litecoin";

  try {
    const res = await fetch(url);
    coins = await res.json();

    render(coins);
  } catch (e) {
    console.log("Market error", e);
  }
}

/* =========================
   FAVORITE SYSTEM
========================= */
function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("fav", JSON.stringify(favorites));
  render(coins);
}

/* =========================
   OPEN CHART
========================= */
async function openChart(id, name) {

  currentCoin = id;
  currentName = name;
  currentDays = 7;

  document.getElementById("chartModal").style.display = "block";

  loadChart();
}

/* =========================
   TIMEFRAME (READY)
========================= */
function changeTF(days) {
  currentDays = days;
  loadChart();
}

/* =========================
   LOAD CHART DATA
========================= */
async function loadChart() {

  const url =
    `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${currentDays}`;

  const res = await fetch(url);
  const data = await res.json();

  let candles = createCandles(data.prices);

  let rsi = calculateRSI(data.prices);
  let ma = calculateMA(candles, 7);
  let ai = aiPrediction(candles, ma, rsi);

  drawChart(candles, ma, rsi, ai);
}

/* =========================
   OHLC CANDLE BUILDER
========================= */
function createCandles(prices) {

  let candles = [];
  let chunk = Math.max(1, Math.floor(prices.length / 20));

  for (let i = 0; i < prices.length; i += chunk) {

    let slice = prices.slice(i, i + chunk);
    if (!slice.length) continue;

    let open = slice[0][1];
    let close = slice[slice.length - 1][1];
    let high = Math.max(...slice.map(p => p[1]));
    let low = Math.min(...slice.map(p => p[1]));

    candles.push({ open, high, low, close });
  }

  return candles;
}

/* =========================
   RSI (14)
========================= */
function calculateRSI(prices, period = 14) {

  if (prices.length < period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {

    let diff = prices[i][1] - prices[i - 1][1];

    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let rs = (gains / period) / ((losses / period) || 1);

  return 100 - (100 / (1 + rs));
}

/* =========================
   MOVING AVERAGE
========================= */
function calculateMA(candles, period = 7) {

  let ma = [];

  for (let i = 0; i < candles.length; i++) {

    let slice = candles.slice(Math.max(0, i - period), i + 1);

    let avg = slice.reduce((a, b) => a + b.close, 0) / slice.length;

    ma.push(avg);
  }

  return ma;
}

/* =========================
   AI PREDICTION ENGINE
========================= */
function aiPrediction(candles, ma, rsi) {

  let last = candles[candles.length - 1];
  let first = candles[0];

  let priceTrend = last.close - first.close;
  let maTrend = ma[ma.length - 1] - ma[0];

  let score = 0;

  // RSI logic
  if (rsi < 30) score += 2;
  else if (rsi > 70) score -= 2;
  else score += 0.5;

  // MA trend
  if (maTrend > 0) score += 1;
  else score -= 1;

  // price momentum
  if (priceTrend > 0) score += 1;
  else score -= 1;

  let signal = "⚪ SIDEWAYS";
  let confidence = Math.min(100, Math.abs(score) * 33);

  if (score >= 2) signal = "🟢 BULLISH (BUY ZONE)";
  else if (score <= -2) signal = "🔴 BEARISH (SELL ZONE)";

  return { signal, confidence };
}

/* =========================
   DRAW CHART
========================= */
function drawChart(candles, ma, rsi, ai) {

  const canvas = document.getElementById("candleChart");
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 420;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let max = Math.max(...candles.map(c => c.high));
  let min = Math.min(...candles.map(c => c.low));

  let step = canvas.width / candles.length;

  /* ================= CANDLES ================= */
  candles.forEach((c, i) => {

    let x = i * step + step / 2;

    let openY = canvas.height - ((c.open - min) / (max - min)) * canvas.height;
    let closeY = canvas.height - ((c.close - min) / (max - min)) * canvas.height;
    let highY = canvas.height - ((c.high - min) / (max - min)) * canvas.height;
    let lowY = canvas.height - ((c.low - min) / (max - min)) * canvas.height;

    ctx.strokeStyle = "#999";
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    ctx.fillStyle = c.close >= c.open ? "#00ff88" : "#ff4d4d";

    ctx.fillRect(
      x - 4,
      Math.min(openY, closeY),
      8,
      Math.max(2, Math.abs(closeY - openY))
    );
  });

  /* ================= MA LINE ================= */
  ctx.strokeStyle = "#00ccff";
  ctx.lineWidth = 2;
  ctx.beginPath();

  ma.forEach((val, i) => {

    let x = i * step + step / 2;
    let y = canvas.height - ((val - min) / (max - min)) * canvas.height;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  /* ================= INFO TEXT ================= */
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";

  ctx.fillText("RSI: " + rsi.toFixed(2), 20, 20);

  ctx.fillText(ai.signal, 20, 45);

  ctx.fillText("Confidence: " + ai.confidence.toFixed(0) + "%", 20, 70);
}

/* =========================
   CLOSE CHART
========================= */
function closeChart() {
  document.getElementById("chartModal").style.display = "none";
}

/* =========================
   RENDER TABLE
========================= */
function render(data) {

  let html = "";

  data.forEach((c, i) => {

    let fav = favorites.includes(c.id) ? "star active" : "star";

    html += `
      <tr>

        <td onclick="toggleFav('${c.id}')">
          <span class="${fav}">★</span>
        </td>

        <td>${i + 1}</td>

        <td>
          <div class="coin" onclick="openChart('${c.id}','${c.name}')">
            <img src="${c.image}">
            ${c.name}
          </div>

          <small id="${c.id}-live" style="color:#00ffcc"></small>
        </td>

        <td>$${c.current_price.toLocaleString()}</td>

        <td style="color:${c.price_change_percentage_24h >= 0 ? '#00ff88' : '#ff4d4d'}">
          ${c.price_change_percentage_24h.toFixed(2)}%
        </td>

        <td>$${c.market_cap.toLocaleString()}</td>

      </tr>
    `;
  });

  document.getElementById("coinTable").innerHTML = html;
}

/* =========================
   SEARCH
========================= */
document.addEventListener("input", (e) => {

  if (e.target.id === "searchBox") {

    let val = e.target.value.toLowerCase();

    let filtered = coins.filter(c =>
      c.name.toLowerCase().includes(val) ||
      c.symbol.toLowerCase().includes(val)
    );

    render(filtered);
  }
});

/* =========================
   REALTIME WS BINANCE
========================= */
const ws = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=" +
  "btcusdt@trade/ethusdt@trade/dogeusdt@trade/solusdt@trade"
);

ws.onmessage = (event) => {

  let msg = JSON.parse(event.data);
  let d = msg.data;

  let symbol = d.s.toLowerCase().replace("usdt", "");
  let price = parseFloat(d.p);

  let el = document.getElementById(symbol + "-live");

  if (el) {
    el.innerText = "LIVE: $" + price.toFixed(2);
  }
};

/* =========================
   INIT
========================= */
loadMarket();
setInterval(loadMarket, 15000);