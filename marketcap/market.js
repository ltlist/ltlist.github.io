let coins = [];
let filteredCoins = [];
let page = 1;
let loading = false;

const coinList = document.getElementById("coinList");

loadMarket();

/* LOAD MARKET */
async function loadMarket(){

  if(loading) return;
  loading = true;

  try {

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}`
    );

    const data = await res.json();

    if(!Array.isArray(data)) throw new Error("API ERROR");

    coins = coins.concat(data);
    filteredCoins = coins;

    renderCoins();

    page++;

  } catch(err){
    console.log(err);
    coinList.innerHTML = "<p>Failed load data</p>";
  }

  loading = false;
}

/* RENDER */
function renderCoins(){

  let html = "";

  filteredCoins.forEach(c=>{

    html += `
      <div class="coin-item" onclick="openCoin('${c.id}')">

        <div class="coin-left">
          <img src="${c.image}">
          <div>
            <div>${c.name}</div>
            <small>$${c.current_price}</small>
          </div>
        </div>

        <div style="color:${c.price_change_percentage_24h>=0?'#00ff88':'#ff4d4d'}">
          ${c.price_change_percentage_24h?.toFixed(2) || 0}%
        </div>

      </div>
    `;
  });

  coinList.innerHTML = html;
}

/* SEARCH */
function filterCoins(){

  const val = document.getElementById("searchBox").value.toLowerCase().trim();

  filteredCoins = val
    ? coins.filter(c =>
        c.name.toLowerCase().includes(val) ||
        c.symbol.toLowerCase().includes(val)
      )
    : coins;

  renderCoins();
}

/* OPEN COIN PAGE */
function openCoin(id){
  window.location.href = `coin.html?id=${id}`;
}

/* LOAD MORE */
function loadMore(){
  loadMarket();
}

/* INFINITE SCROLL */
window.addEventListener("scroll", () => {

  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200){
    loadMarket();
  }
});