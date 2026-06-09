let coins = [];
let priceMap = {};

let wallet = {
  usdt: 1000,
  assets: {},
  positions: []
};

const FEE = 0.001;

/* =========================
   LOAD MARKET
========================= */
async function loadMarket(){

  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10&page=1"
  );

  coins = await res.json();

  coins.forEach(c=>{
    priceMap[c.id] = c.current_price;
  });

  renderCoins();
  updateUI();
}

/* =========================
   RENDER MARKET
========================= */
function renderCoins(){

  let html = "";

  coins.forEach(c=>{

    let price = priceMap[c.id];

    html += `
      <div class="coin-item" onclick="trade('${c.id}')">

        <div class="coin-left">
          <img src="${c.image}">
          <div>${c.name}</div>
        </div>

        <div>$${price.toFixed(2)}</div>

      </div>
    `;
  });

  document.getElementById("coinList").innerHTML = html;
}

/* =========================
   TRADE (BUY/SELL)
========================= */
function trade(id){

  let amount = prompt("Amount:");

  if(!amount) return;

  amount = parseFloat(amount);

  let action = confirm("OK = BUY | Cancel = SELL");

  if(action){
    buy(id, amount);
  } else {
    sell(id, amount);
  }
}

/* =========================
   BUY
========================= */
function buy(id, amount){

  let price = priceMap[id];

  let cost = amount * price;
  let fee = cost * FEE;
  let total = cost + fee;

  if(wallet.usdt < total){
    alert("Not enough USDT");
    return;
  }

  wallet.usdt -= total;

  wallet.assets[id] = (wallet.assets[id] || 0) + amount;

  wallet.positions.push({
    id,
    amount,
    entry: price
  });

  save();
  updateUI();
}

/* =========================
   SELL
========================= */
function sell(id, amount){

  let price = priceMap[id];

  if(!wallet.assets[id] || wallet.assets[id] < amount){
    alert("Not enough coin");
    return;
  }

  let revenue = amount * price;
  let fee = revenue * FEE;

  wallet.usdt += (revenue - fee);

  wallet.assets[id] -= amount;

  if(wallet.assets[id] <= 0){
    delete wallet.assets[id];
  }

  save();
  updateUI();
}

/* =========================
   UI UPDATE
========================= */
function updateUI(){

  document.getElementById("usdtBal").innerText =
    wallet.usdt.toFixed(2);

  renderPortfolio();
  renderPositions();
}

/* =========================
   PORTFOLIO
========================= */
function renderPortfolio(){

  let html = "";

  for(let id in wallet.assets){

    let price = priceMap[id];
    let value = wallet.assets[id] * price;

    html += `
      <div class="coin-item">
        <div>${id.toUpperCase()}</div>
        <div>$${value.toFixed(2)}</div>
      </div>
    `;
  }

  document.getElementById("portfolio").innerHTML =
    html || "<p>No assets</p>";
}

/* =========================
   POSITIONS (P/L)
========================= */
function renderPositions(){

  let html = "";

  wallet.positions.forEach(p=>{

    let price = priceMap[p.id];
    let pnl = (price - p.entry) * p.amount;

    html += `
      <div class="coin-item">
        <div>${p.id.toUpperCase()}</div>
        <div style="color:${pnl>=0?'#00ffcc':'#ff4d4d'}">
          $${pnl.toFixed(2)}
        </div>
      </div>
    `;
  });

  document.getElementById("positions").innerHTML =
    html || "<p>No open positions</p>";
}

/* =========================
   SAVE LOCAL
========================= */
function save(){
  localStorage.setItem("wallet", JSON.stringify(wallet));
}

/* =========================
   LOAD LOCAL
========================= */
function load(){

  let data = localStorage.getItem("wallet");

  if(data){
    wallet = JSON.parse(data);
  }
}

/* =========================
   INIT
========================= */
load();
loadMarket();