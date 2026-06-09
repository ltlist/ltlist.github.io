import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT.appspot.com",
  messagingSenderId: "XXXXXXXX",
  appId: "XXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");

let allFaucets = [];

// LOAD DATA
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((doc) => {

    const data = doc.data();

    // tampilkan hanya active
    if (data.status === "active") {
      allFaucets.push(data);
    }

  });

  // ranking
  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  render(allFaucets);
  renderCoinStats();
  loadCoinFilter();
}

// RENDER LIST
function render(data) {

  let html = "";

  data.forEach((d) => {

    html += `
      <div class="card">

        <div class="rank-badge">
          #${d.rank || "-"}
        </div>

        <h3>${d.name}</h3>

        <p>
          Coin: <b>${d.coin}</b>
        </p>

        <a href="${d.url}" target="_blank" class="visit-btn">
          Visit Faucet
        </a>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

// COIN FILTER AUTO
function loadCoinFilter() {

  const select = document.getElementById("coinFilter");

  select.innerHTML = `
    <option value="all">All Coins</option>
  `;

  const coins = [...new Set(allFaucets.map(f => f.coin))];

  coins.sort();

  coins.forEach((coin) => {

    const option = document.createElement("option");

    option.value = coin;
    option.textContent = coin;

    select.appendChild(option);

  });
}

// COIN COUNTER
function renderCoinStats() {

  const count = {};

  allFaucets.forEach((f) => {

    count[f.coin] = (count[f.coin] || 0) + 1;

  });

  let html = "";

  Object.keys(count).sort().forEach((coin) => {

    html += `
      <span class="badge">
        ${coin} (${count[coin]})
      </span>
    `;

  });

  document.getElementById("coinStats").innerHTML = html;
}

// SEARCH
window.searchPublic = function () {

  const q = document
    .getElementById("search")
    .value
    .toLowerCase();

  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(q)
  );

  render(filtered);
};

// FILTER COIN
window.filterCoin = function () {

  const coin = document.getElementById("coinFilter").value;

  if (coin === "all") {

    render(allFaucets);
    return;

  }

  const filtered = allFaucets.filter(f =>
    f.coin === coin
  );

  render(filtered);
};

loadFaucets();