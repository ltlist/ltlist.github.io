let coins = [];
let currentCoin = null;
let currentName = "";
let currentDays = 7;

/* PAGE SWITCH */
function showPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
}

/* LOAD MARKET */
async function loadMarket(){

  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,dogecoin,solana,litecoin"
  );

  coins = await res.json();
  renderCoins();
}

/* RENDER MARKET */
function renderCoins(){

  let html = "";

  coins.forEach(c=>{

    html += `
      <div class="coin-item" onclick="openChart('${c.id}','${c.name}')">

        <div class="coin-left">
          <img src="${c.image}">
          <div>
            <div>${c.name}</div>
            <small>$${c.current_price}</small>
          </div>
        </div>

        <div style="color:${c.price_change_percentage_24h>=0?'#00ff88':'#ff4d4d'}">
          ${c.price_change_percentage_24h.toFixed(2)}%
        </div>

      </div>
    `;
  });

  document.getElementById("coinList").innerHTML = html;
}

/* OPEN CHART */
async function openChart(id,name){

  currentCoin = id;
  currentName = name;

  document.getElementById("chartModal").style.display="block";

  loadChart();
}

/* TIMEFRAME */
function changeTF(days){
  currentDays = days;
  loadChart();
}

/* LOAD CHART */
async function loadChart(){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${currentDays}`
  );

  const data = await res.json();

  let candles = createCandles(data.prices);

  drawChart(candles);
}

/* OHLC */
function createCandles(prices){

  let candles = [];
  let chunk = Math.max(1, Math.floor(prices.length/20));

  for(let i=0;i<prices.length;i+=chunk){

    let slice = prices.slice(i,i+chunk);
    if(!slice.length) continue;

    candles.push({
      open: slice[0][1],
      close: slice[slice.length-1][1],
      high: Math.max(...slice.map(p=>p[1])),
      low: Math.min(...slice.map(p=>p[1]))
    });
  }

  return candles;
}

/* DRAW */
function drawChart(candles){

  let canvas = document.getElementById("candleChart");
  let ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 400;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let max = Math.max(...candles.map(c=>c.high));
  let min = Math.min(...candles.map(c=>c.low));

  let step = canvas.width / candles.length;

  candles.forEach((c,i)=>{

    let x = i*step + step/2;

    let openY = canvas.height - ((c.open-min)/(max-min))*canvas.height;
    let closeY = canvas.height - ((c.close-min)/(max-min))*canvas.height;
    let highY = canvas.height - ((c.high-min)/(max-min))*canvas.height;
    let lowY = canvas.height - ((c.low-min)/(max-min))*canvas.height;

    ctx.strokeStyle="#fff";
    ctx.beginPath();
    ctx.moveTo(x,highY);
    ctx.lineTo(x,lowY);
    ctx.stroke();

    ctx.fillStyle = c.close>=c.open ? "#00ff88" : "#ff4d4d";

    ctx.fillRect(x-4,Math.min(openY,closeY),8,Math.abs(closeY-openY));
  });
}

/* CLOSE */
function closeChart(){
  document.getElementById("chartModal").style.display="none";
}

/* INIT */
loadMarket();
setInterval(loadMarket,15000);