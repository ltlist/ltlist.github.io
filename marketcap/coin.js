const id = new URLSearchParams(window.location.search).get("id");

let currentDays = 7;
let candlesData = [];

/* AUTO START */
init();

async function init(){

  if(!id){
    document.getElementById("fundamental").innerHTML =
      "❌ Coin ID tidak ditemukan";
    return;
  }

  await loadCoin();
  window.addEventListener("resize", draw);
}

/* LOAD COIN INFO */
async function loadCoin(){

  try{

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}`
    );

    const data = await res.json();

    if(!data || !data.market_data){
      throw new Error("Data tidak tersedia");
    }

    document.title =
      `${data.name} Price Today | LTList MarketCap`;

    document.getElementById("coinName").innerHTML = `
      <img
        src="${data.image.small}"
        width="28"
        height="28"
        style="vertical-align:middle;margin-right:8px;"
      >
      ${data.name}
    `;

    document.getElementById("priceBox").innerHTML = `
      <h2>
        $${Number(data.market_data.current_price.usd).toLocaleString()}
      </h2>

      <p>
        Rp ${Number(
          data.market_data.current_price.idr || 0
        ).toLocaleString("id-ID")}
      </p>

      <p>
        Market Cap:
        $${Number(
          data.market_data.market_cap.usd
        ).toLocaleString()}
      </p>

      <p>
        Volume:
        $${Number(
          data.market_data.total_volume.usd
        ).toLocaleString()}
      </p>

      <p style="
        color:${data.market_data.price_change_percentage_24h >= 0
          ? '#00ff88'
          : '#ff4d4d'};
      ">
        24h:
        ${Number(
          data.market_data.price_change_percentage_24h || 0
        ).toFixed(2)}%
      </p>
    `;

    document.getElementById("fundamental").innerHTML = `
      <p><b>Rank:</b> #${data.market_cap_rank || "-"}</p>

      <p>
        <b>ATH:</b>
        $${Number(
          data.market_data.ath.usd
        ).toLocaleString()}
      </p>

      <p>
        <b>ATL:</b>
        $${Number(
          data.market_data.atl.usd
        ).toLocaleString()}
      </p>

      <p>
        <b>Circulating Supply:</b>
        ${Number(
          data.market_data.circulating_supply || 0
        ).toLocaleString()}
      </p>

      <br>

      <button
        onclick="openArticle()"
        style="
          width:100%;
          padding:12px;
          border:none;
          border-radius:10px;
          cursor:pointer;
          font-size:15px;
        "
      >
        📖 Read Full Analysis
      </button>
    `;

    await loadChart();

  }catch(err){

    console.error(err);

    document.getElementById("priceBox").innerHTML =
      "❌ Gagal mengambil data coin";

    document.getElementById("fundamental").innerHTML =
      "❌ API CoinGecko error";
  }
}

/* TIMEFRAME */
function setTF(days){
  currentDays = days;
  loadChart();
}

/* LOAD CHART */
async function loadChart(){

  try{

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${currentDays}`
    );

    const data = await res.json();

    if(!data.prices){
      return;
    }

    candlesData = createCandles(
      data.prices,
      data.total_volumes
    );

    draw();

  }catch(err){
    console.error(err);
  }
}

/* CREATE OHLC */
function createCandles(prices, volumes){

  const candles = [];

  const chunk =
    Math.max(1, Math.floor(prices.length / 60));

  for(let i=0;i<prices.length;i+=chunk){

    const slice =
      prices.slice(i,i+chunk);

    const volSlice =
      volumes.slice(i,i+chunk);

    candles.push({
      open: slice[0][1],
      close: slice[slice.length-1][1],
      high: Math.max(...slice.map(p=>p[1])),
      low: Math.min(...slice.map(p=>p[1])),
      volume: volSlice.reduce(
        (a,b)=>a+b[1],0
      )
    });
  }

  return candles;
}

/* DRAW */
function draw(){
  drawCandles();
  drawOverlay();
  drawMACD();
}

/* DRAW CANDLES */
function drawCandles(){

  const canvas =
    document.getElementById("candleChart");

  if(!canvas) return;

  const ctx =
    canvas.getContext("2d");

  canvas.width =
    Math.min(window.innerWidth * 0.95, 1000);

  canvas.height = 350;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if(!candlesData || candlesData.length < 2){
    return;
  }

  const max =
    Math.max(...candlesData.map(c=>c.high));

  const min =
    Math.min(...candlesData.map(c=>c.low));

  const range =
    (max - min) || 1;

  const step =
    canvas.width / candlesData.length;

  /* GRID */

  ctx.strokeStyle = "#1f2937";

  for(let i=0;i<=10;i++){

    const y =
      (canvas.height / 10) * i;

    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }

  /* CANDLES */

  candlesData.forEach((c,i)=>{

    const x =
      i * step + step/2;

    const scale = v =>
      canvas.height -
      ((v-min)/range) *
      canvas.height;

    const o = scale(c.open);
    const cl = scale(c.close);
    const h = scale(c.high);
    const l = scale(c.low);

    ctx.strokeStyle = "#999";

    ctx.beginPath();
    ctx.moveTo(x,h);
    ctx.lineTo(x,l);
    ctx.stroke();

    ctx.fillStyle =
      c.close >= c.open
      ? "#00ff88"
      : "#ff4d4d";

    ctx.fillRect(
      x-3,
      Math.min(o,cl),
      6,
      Math.max(
        1,
        Math.abs(cl-o)
      )
    );
  });

  /* VOLUME */

  const vMax =
    Math.max(
      ...candlesData.map(
        d=>d.volume || 1
      )
    );

  candlesData.forEach((c,i)=>{

    const x = i*step;

    const vh =
      ((c.volume || 0) / vMax) * 60;

    ctx.fillStyle =
      "rgba(100,100,255,0.3)";

    ctx.fillRect(
      x,
      canvas.height - vh,
      step,
      vh
    );
  });
}

/* CROSSHAIR */
function drawOverlay(){

  const canvas =
    document.getElementById("overlay");

  if(!canvas) return;

  const ctx =
    canvas.getContext("2d");

  canvas.width =
    Math.min(window.innerWidth * 0.95,1000);

  canvas.height = 350;

  canvas.onmousemove = e => {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const x = e.offsetX;
    const y = e.offsetY;

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

/* EMA */
function ema(data,period){

  const k =
    2 / (period + 1);

  const out = [data[0]];

  for(let i=1;i<data.length;i++){

    out[i] =
      data[i]*k +
      out[i-1]*(1-k);
  }

  return out;
}

/* MACD */
function drawMACD(){

  const canvas =
    document.getElementById("macdChart");

  if(!canvas) return;

  const ctx =
    canvas.getContext("2d");

  canvas.width =
    Math.min(window.innerWidth * 0.95,1000);

  canvas.height = 180;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const closes =
    candlesData.map(c=>c.close);

  if(closes.length < 20){
    return;
  }

  const ema12 =
    ema(closes,12);

  const ema26 =
    ema(closes,26);

  const macd =
    ema12.map(
      (v,i)=>v-ema26[i]
    );

  const signal =
    ema(macd,9);

  const step =
    canvas.width /
    macd.length;

  ctx.strokeStyle =
    "#00ffcc";

  ctx.beginPath();

  macd.forEach((v,i)=>{

    const x = i*step;
    const y =
      canvas.height/2 -
      v*10;

    if(i===0)
      ctx.moveTo(x,y);
    else
      ctx.lineTo(x,y);
  });

  ctx.stroke();

  ctx.strokeStyle =
    "#ffcc00";

  ctx.beginPath();

  signal.forEach((v,i)=>{

    const x = i*step;
    const y =
      canvas.height/2 -
      v*10;

    if(i===0)
      ctx.moveTo(x,y);
    else
      ctx.lineTo(x,y);
  });

  ctx.stroke();
}

/* OPEN ARTICLE */
function openArticle(){
  window.location.href =
    `article.html?id=${id}`;
}