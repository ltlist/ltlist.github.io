const id = new URLSearchParams(window.location.search).get("id");

let currentDays = 7;
let candlesData = [];
let zoom = 1;

/* LOAD COIN INFO */
async function loadCoin(){

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const data = await res.json();

  document.getElementById("coinName").innerText = data.name;

  loadChart();
}

/* TIMEFRAME */
function setTF(days){
  currentDays = days;
  loadChart();
}

/* LOAD CHART DATA */
async function loadChart(){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${currentDays}`
  );

  const data = await res.json();

  candlesData = createCandles(data.prices, data.total_volumes);

  draw();
}

/* CREATE OHLC + VOLUME */
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

/* RSI */
function calcRSI(data, period=14){

  let gains=0, losses=0;

  for(let i=1;i<period;i++){
    let diff = data[i].close - data[i-1].close;
    if(diff>=0) gains+=diff;
    else losses-=diff;
  }

  let rs = gains/(losses || 1);
  return 100 - (100/(1+rs));
}

/* MA */
function calcMA(data, period=10){

  let ma = [];

  for(let i=0;i<data.length;i++){
    if(i<period) ma.push(null);
    else{
      let sum=0;
      for(let j=0;j<period;j++){
        sum += data[i-j].close;
      }
      ma.push(sum/period);
    }
  }

  return ma;
}

/* DRAW ALL */
function draw(){

  drawCandles();
  drawOverlay();
}

/* MAIN CHART */
function drawCandles(){

  const canvas = document.getElementById("candleChart");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 350;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let data = candlesData.slice(-Math.floor(candlesData.length*zoom));

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

  /* MA */
  let ma = calcMA(data,10);
  ctx.strokeStyle = "#00ffcc";
  ctx.beginPath();

  data.forEach((c,i)=>{
    if(ma[i]){
      let x = i*step;
      let y = canvas.height - ((ma[i]-min)/(max-min))*canvas.height;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
  });

  ctx.stroke();

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

    let vh = (c.volume/vMax)*80;

    ctx.fillStyle = "rgba(100,100,255,0.4)";
    ctx.fillRect(x,canvas.height-vh,step,vh);
  });

  window.chartData = data;
}

/* CROSSHAIR + ZOOM */
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

    /* vertical */
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();

    /* horizontal */
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  };

  /* ZOOM (scroll) */
  canvas.onwheel = (e)=>{

    e.preventDefault();

    if(e.deltaY < 0){
      zoom += 0.1;
    }else{
      zoom -= 0.1;
    }

    zoom = Math.max(0.3, Math.min(1, zoom));

    drawCandles();
  };
}

loadCoin();