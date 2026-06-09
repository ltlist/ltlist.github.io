const id = new URLSearchParams(window.location.search).get("id");

/* LOAD COIN DETAIL */
async function loadCoin(){

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const data = await res.json();

  document.getElementById("coinName").innerText = data.name;

  /* PRICE BOX */
  document.getElementById("priceBox").innerHTML = `
    <h2>$${data.market_data.current_price.usd}</h2>
    <p style="color:${data.market_data.price_change_percentage_24h>=0?'#00ff88':'#ff4d4d'}">
      24h: ${data.market_data.price_change_percentage_24h.toFixed(2)}%
    </p>
    <p>Market Cap: $${data.market_data.market_cap.usd.toLocaleString()}</p>
    <p>Volume: $${data.market_data.total_volume.usd.toLocaleString()}</p>
  `;

  /* FUNDAMENTAL */
  document.getElementById("fundamental").innerHTML = `
    <p>Rank: #${data.market_cap_rank}</p>
    <p>ATH: $${data.market_data.ath.usd}</p>
    <p>ATL: $${data.market_data.atl.usd}</p>
    <p>Circulating Supply: ${data.market_data.circulating_supply.toLocaleString()}</p>
    <p>Total Supply: ${data.market_data.total_supply || 'N/A'}</p>
  `;

  loadChart();
}

/* FULL SCREEN LINE CHART */
async function loadChart(){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
  );

  const data = await res.json();
  let prices = data.prices;

  let canvas = document.getElementById("fullChart");
  let ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 300;

  let max = Math.max(...prices.map(p=>p[1]));
  let min = Math.min(...prices.map(p=>p[1]));

  let step = canvas.width / prices.length;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 2;

  ctx.beginPath();

  prices.forEach((p,i)=>{

    let x = i * step;
    let y = canvas.height - ((p[1]-min)/(max-min))*canvas.height;

    if(i === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();
}

loadCoin();