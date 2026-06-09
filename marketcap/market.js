let coins = [];
let currentCoin = null;

/* =========================
   LOAD MARKET
========================= */
async function loadMarket(){

  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1"
  );

  coins = await res.json();

  renderCoins();
}

/* =========================
   RENDER MARKET
========================= */
function renderCoins(){

  let q = document.getElementById("search").value?.toLowerCase() || "";

  let list = coins.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.symbol.toLowerCase().includes(q)
  );

  let html = "";

  list.forEach((c,i)=>{

    html += `
      <div class="coin" onclick="openDetail('${c.id}','${c.name}','${c.current_price}','${c.price_change_percentage_24h}')">

        <div>
          <b>${c.name}</b><br>
          <small>${c.symbol.toUpperCase()}</small>
        </div>

        <div style="text-align:right">
          <div>$${c.current_price}</div>
          <small style="color:${c.price_change_percentage_24h>=0?'#00ffcc':'#ff4d4d'}">
            ${c.price_change_percentage_24h.toFixed(2)}%
          </small>
        </div>

      </div>
    `;
  });

  document.getElementById("coinList").innerHTML = html;
}

/* =========================
   OPEN DETAIL
========================= */
function openDetail(id,name,price,change){

  currentCoin = id;

  document.getElementById("detail").style.display = "flex";

  document.getElementById("coinName").innerText = name;
  document.getElementById("coinPrice").innerText = "$" + price;
  document.getElementById("coinChange").innerText = change.toFixed(2) + "%";

  loadChart(1);
}

/* =========================
   CLOSE DETAIL
========================= */
function closeDetail(){
  document.getElementById("detail").style.display = "none";
}

/* =========================
   LOAD CHART (OHLC SIMPLIFIED)
========================= */
async function loadChart(days){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${days}`
  );

  const data = await res.json();

  let prices = data.prices;

  drawChart(prices);
}

/* =========================
   DRAW BINANCE STYLE CHART
========================= */
function drawChart(prices){

  let canvas = document.getElementById("chart");
  let ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 300;

  ctx.clearRect(0,0,400,300);

  let max = Math.max(...prices.map(p=>p[1]));
  let min = Math.min(...prices.map(p=>p[1]));

  let step = 400 / prices.length;

  prices.forEach((p,i)=>{

    let x = i * step;

    let y = 300 - ((p[1]-min)/(max-min))*300;

    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(x, y, 2, 2);
  });
}

/* =========================
   INIT
========================= */
loadMarket();
setInterval(loadMarket,30000);