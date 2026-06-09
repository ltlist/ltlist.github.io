/***********************
 * LTList Market PRO
 * CoinGecko + Binance WS
 ***********************/

let coins = [];
let favorites = JSON.parse(localStorage.getItem("fav")) || [];
let currentCoin = null;
let currentName = "";
let currentDays = 7;

/* ======================
   COINGECKO MARKET DATA
====================== */
async function loadMarket() {

  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,dogecoin,solana,ripple,cardano,tron,litecoin";

  try {
    const res = await fetch(url);
    coins = await res.json();

    render(coins);
  } catch (e) {
    console.log("API error", e);
  }
}

/* ======================
   FAVORITE SYSTEM
====================== */
function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("fav", JSON.stringify(favorites));
  render(coins);
}

/* ======================
   OPEN CHART
====================== */
async function openChart(id, name) {

  currentCoin = id;
  currentName = name;
  currentDays = 7;

  document.getElementById("chartModal").style.display = "block";

  loadChart();
}

/* ======================
   TIMEFRAME SWITCH
====================== */
function changeTF(days) {
  currentDays = days;
  loadChart();
}

/* ======================
   LOAD CHART DATA
====================== */
async function loadChart() {

  const url = `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${currentDays}`;

  const res = await fetch(url);
  const data = await res.json();

  let candles = createCandles(data.prices);

  drawCandles(candles);
}

/* ======================
   OHLC CONVERTER
====================== */
function createCandles(prices) {

  let candles = [];
  let chunkSize = Math.max(1, Math.floor(prices.length / 20));

  for (let i = 0; i < prices.length; i += chunkSize) {

    let slice = prices.slice(i, i + chunkSize);

    if (!slice.length) continue;

    let open = slice[0][1];
    let close = slice[slice.length - 1][1];
    let high = Math.max(...slice.map(p => p[1]));
    let low = Math.min(...slice.map(p => p[1]));

    candles.push({ open, high, low, close });
  }

  return candles;
}

/* ======================
   CANDLESTICK DRAW
====================== */
function drawCandles(candles) {

  const canvas = document.getElementById("candleChart");
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 420;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let max = Math.max(...candles.map(c => c.high));
  let min = Math.min(...candles.map(c => c.low));

  let step = canvas.width / candles.length;

  candles.forEach((c, i) => {

    let x = i * step + step / 2;

    let openY = canvas.height - ((c.open - min) / (max - min)) * canvas.height;
    let closeY = canvas.height - ((c.close - min) / (max - min)) * canvas.height;
    let highY = canvas.height - ((c.high - min) / (max - min)) * canvas.height;
    let lowY = canvas.height - ((c.low - min) / (max - min)) * canvas.height;

    // wick
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    // body
    ctx.fillStyle = c.close >= c.open ? "#00ff88" : "#ff4d4d";

    ctx.fillRect(
      x - 4,
      Math.min(openY, closeY),
      8,
      Math.max(2, Math.abs(closeY - openY))
    );
  });
}

/* ======================
   CLOSE CHART
====================== */
function closeChart() {
  document.getElementById("chartModal").style.display = "none";
}

/* ======================
   RENDER TABLE
====================== */
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

        <td>
          $${c.current_price.toLocaleString()}
        </td>

        <td style="color:${c.price_change_percentage_24h >= 0 ? '#00ff88' : '#ff4d4d'}">
          ${c.price_change_percentage_24h.toFixed(2)}%
        </td>

        <td>
          $${c.market_cap.toLocaleString()}
        </td>

      </tr>
    `;
  });

  document.getElementById("coinTable").innerHTML = html;
}

/* ======================
   SEARCH
====================== */
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

/* ======================
   BINANCE REAL-TIME WS
====================== */
const ws = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=" +
  "btcusdt@trade/ethusdt@trade/dogeusdt@trade/solusdt@trade"
);

ws.onmessage = (event) => {

  let msg = JSON.parse(event.data);
  let data = msg.data;

  let symbol = data.s.toLowerCase().replace("usdt", "");
  let price = parseFloat(data.p);

  let el = document.getElementById(symbol + "-live");

  if (el) {
    el.innerText = "LIVE: $" + price.toFixed(2);
  }
};

/* ======================
   INIT
====================== */
loadMarket();
setInterval(loadMarket, 15000);