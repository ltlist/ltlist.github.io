let coins = [];
let favorites = JSON.parse(localStorage.getItem("fav")) || [];

async function loadMarket(){

  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,dogecoin,ethereum,solana,ripple,cardano,tron,litecoin";

  const res = await fetch(url);
  coins = await res.json();

  render(coins);
}

/* FAVORITE */
function toggleFav(id){
  if(favorites.includes(id)){
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("fav", JSON.stringify(favorites));
  render(coins);
}

/* OPEN CHART (TradingView STYLE) */
async function openChart(id,name){

  document.getElementById("chartModal").style.display="block";
  document.getElementById("chartTitle").innerText = name + " (7D Trend)";

  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`;
  const res = await fetch(url);
  const data = await res.json();

  let prices = data.prices;

  drawTVChart(prices);
}

/* TRADINGVIEW STYLE LINE (smooth + glow) */
function drawTVChart(prices){

  let canvas = document.getElementById("tvChart");
  let ctx = canvas.getContext("2d");

  canvas.width = 850;
  canvas.height = 350;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  let max = Math.max(...prices.map(p=>p[1]));
  let min = Math.min(...prices.map(p=>p[1]));

  let w = canvas.width;
  let h = canvas.height;

  let step = w / prices.length;

  ctx.strokeStyle = "#00ffcc";
  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;

  ctx.beginPath();

  prices.forEach((p,i)=>{

    let x = i * step;
    let y = h - ((p[1]-min)/(max-min))*h;

    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);

  });

  ctx.stroke();

  /* background grid (TradingView feel) */
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#1f2937";

  for(let i=0;i<5;i++){
    let y = (h/5)*i;
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(w,y);
    ctx.stroke();
  }
}

/* CLOSE */
function closeChart(){
  document.getElementById("chartModal").style.display="none";
}

/* RENDER TABLE */
function render(data){

  let html="";

  data.forEach((c,i)=>{

    let fav = favorites.includes(c.id) ? "star active" : "star";

    html += `
      <tr>

        <td onclick="toggleFav('${c.id}')">
          <span class="${fav}">★</span>
        </td>

        <td>${i+1}</td>

        <td>
          <div class="coin" onclick="openChart('${c.id}','${c.name}')">
            <img src="${c.image}">
            ${c.name}
          </div>
        </td>

        <td>$${c.current_price.toLocaleString()}</td>

        <td style="color:${c.price_change_percentage_24h>=0?'#00ff88':'#ff4d4d'}">
          ${c.price_change_percentage_24h.toFixed(2)}%
        </td>

        <td>$${c.market_cap.toLocaleString()}</td>

      </tr>
    `;
  });

  document.getElementById("coinTable").innerHTML = html;
}

/* SEARCH */
document.addEventListener("input",(e)=>{

  if(e.target.id==="searchBox"){
    let v = e.target.value.toLowerCase();

    let f = coins.filter(c =>
      c.name.toLowerCase().includes(v) ||
      c.symbol.toLowerCase().includes(v)
    );

    render(f);
  }

});

loadMarket();
setInterval(loadMarket,15000);