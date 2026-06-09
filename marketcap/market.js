let coins = [];

/* =========================
   LOAD MARKET
========================= */
async function loadMarket(){

  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
  );

  coins = await res.json();

  renderCoins();
}

/* =========================
   RENDER COINS
========================= */
function renderCoins(){

  let q = document.getElementById("search").value?.toLowerCase() || "";

  let filtered = coins.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.symbol.toLowerCase().includes(q)
  );

  let html = "";

  filtered.forEach((c,i)=>{

    html += `
      <div class="coin">

        <div class="left">
          <span>${i+1}</span>
          <img src="${c.image}">
          <div>
            <div>${c.name}</div>
            <small>${c.symbol.toUpperCase()}</small>
          </div>
        </div>

        <div style="text-align:right">
          <div>$${c.current_price.toLocaleString()}</div>
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
   INIT
========================= */
loadMarket();
setInterval(loadMarket, 30000);