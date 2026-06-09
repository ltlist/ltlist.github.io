const id = new URLSearchParams(window.location.search).get("id");

let currentDays = 7;
let candlesData = [];

/* LOAD COIN */
async function loadCoin(){

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const data = await res.json();

  document.getElementById("coinName").innerText = data.name;

  document.getElementById("priceBox").innerHTML = `
    <h2>$${data.market_data.current_price.usd}</h2>
    <p>Market Cap: $${data.market_data.market_cap.usd.toLocaleString()}</p>
    <p>24h: ${data.market_data.price_change_percentage_24h.toFixed(2)}%</p>
  `;

  loadChart();
}

/* TIMEFRAME */
function setTF(days){
  currentDays = days;
  loadChart();
}

/* LOAD DATA */
async function loadChart(){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${currentDays}`
  );

  const data = await res.json();

  candlesData = createCandles(data.prices, data.total_volumes);

  draw();
}

/* OHLC */
function createCandles(prices, volumes){

  let candles = [];
  let chunk = Math.max(1, Math.floor(prices.length / 60));

  for(let i=0;i<prices.length;i+=chunk){

    let slice = prices.slice(i,i+chunk);
    let volSlice = volumes.slice(i,i+chunk);

    candles.push({
      open: slice[0][1],
      close: slice[slice.length-1][1],
      high: Math.max(...slice.map(p=>p[1])),
      low: Math.min(...slice.map(p=>p[1])),
      volume: volSlice.reduce((a,b)=>a + b[1],0)
    });
  }

  return candles;
}

/* DRAW ALL */
function draw(){
  drawCandles();
  drawOverlay();
  drawMACD();
}

/* CANDLE */
function drawCandles(){

  const canvas = document.getElementById("candleChart");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 350;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let data = candlesData;

  if(data.length < 2) return;

  let max = Math.max(...data.map(d=>d.high));
  let min = Math.min(...data.map(d=>d.low));

  let step = canvas.width / data.length;

  /* GRID */
  ctx.strokeStyle = "#1f2937";
  for(let i=0;i<10;i++){
    let y = (canvas.height/10)*i;
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }

  /* CANDLES */
  data.forEach((c,i)=>{

    let x = i*step + step/2;

    let scale = v =>
      canvas.height - ((v-min)/(max-min))*canvas.height;

    let o = scale(c.open);
    let cl = scale(c.close);
    let h = scale(c.high);
    let l = scale(c.low);

    ctx.strokeStyle="#999";
    ctx.beginPath();
    ctx.moveTo(x,h);
    ctx.lineTo(x,l);
    ctx.stroke();

    ctx.fillStyle = c.close>=c.open ? "#00ff88" : "#ff4d4d";

    ctx.fillRect(x-3,Math.min(o,cl),6,Math.abs(cl-o));
  });

  /* VOLUME */
  let vMax = Math.max(...data.map(d=>d.volume));

  data.forEach((c,i)=>{

    let x = i*step;
    let vh = (c.volume/vMax)*60;

    ctx.fillStyle = "rgba(100,100,255,0.3)";
    ctx.fillRect(x,canvas.height-vh,step,vh);
  });
}

/* CROSSHAIR */
function drawOverlay(){

  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 350;

  canvas.onmousemove = (e)=>{

    ctx.clearRect(0,0,canvas.width,canvas.height);

    let x = e.offsetX;
    let y = e.offsetY;

    ctx.strokeStyle="#666";

    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  };
}

/* ===================== */
/* MACD ENGINE */
/* ===================== */

function ema(data, period){
  let k = 2 / (period + 1);
  let emaArray = [];

  emaArray[0] = data[0];

  for(let i=1;i<data.length;i++){
    emaArray[i] = data[i] * k + emaArray[i-1] * (1-k);
  }

  return emaArray;
}

function drawMACD(){

  const canvas = document.getElementById("macdChart");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 180;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let closes = candlesData.map(c => c.close);

  if(closes.length < 20) return;

  let ema12 = ema(closes, 12);
  let ema26 = ema(closes, 26);

  let macdLine = ema12.map((v,i)=> v - ema26[i]);
  let signalLine = ema(macdLine, 9);

  let histogram = macdLine.map((v,i)=> v - signalLine[i]);

  let max = Math.max(...macdLine);
  let min = Math.min(...macdLine);

  let step = canvas.width / macdLine.length;

  /* GRID */
  ctx.strokeStyle = "#1f2937";
  for(let i=0;i<5;i++){
    let y = (canvas.height/5)*i;
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }

  function scale(v){
    return canvas.height - ((v-min)/(max-min))*canvas.height;
  }

  /* HISTOGRAM */
  histogram.forEach((h,i)=>{

    let x = i*step;

    ctx.fillStyle = h>=0 ? "rgba(0,255,136,0.4)" : "rgba(255,77,77,0.4)";
    ctx.fillRect(x, canvas.height/2, step, -h*20);
  });

  /* MACD LINE */
  ctx.strokeStyle = "#00ffcc";
  ctx.beginPath();

  macdLine.forEach((v,i)=>{
    let x = i*step;
    let y = scale(v);

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();

  /* SIGNAL LINE */
  ctx.strokeStyle = "#ffcc00";
  ctx.beginPath();

  signalLine.forEach((v,i)=>{
    let x = i*step;
    let y = scale(v);

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();
}

/* START */
loadCoin();