const id = new URLSearchParams(window.location.search).get("id");

async function loadCoin(){

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
  const data = await res.json();

  document.getElementById("coinName").innerText = data.name;

  document.getElementById("priceBox").innerHTML = `
    <h2>$${data.market_data.current_price.usd}</h2>
    <p>Market Cap: $${data.market_data.market_cap.usd}</p>
    <p>24h: ${data.market_data.price_change_percentage_24h.toFixed(2)}%</p>
  `;

  document.getElementById("fundamental").innerHTML = `
    <p>Rank: #${data.market_cap_rank}</p>
    <p>ATH: $${data.market_data.ath.usd}</p>
    <p>ATL: $${data.market_data.atl.usd}</p>
    <p>Supply: ${data.market_data.circulating_supply}</p>
  `;

  loadChart();
}

async function loadChart(){

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
  );

  const data = await res.json();
  const prices = data.prices;

  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth * 0.95;
  canvas.height = 300;

  const max = Math.max(...prices.map(p=>p[1]));
  const min = Math.min(...prices.map(p=>p[1]));

  const step = canvas.width / prices.length;

  ctx.strokeStyle = "#00ffcc";
  ctx.beginPath();

  prices.forEach((p,i)=>{

    const x = i * step;
    const y = canvas.height - ((p[1]-min)/(max-min))*canvas.height;

    if(i === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();
}

loadCoin();