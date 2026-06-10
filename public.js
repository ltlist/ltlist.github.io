import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE CONFIG
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");

let allFaucets = [];

/* =====================
   LOAD FAUCETS
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((docSnap) => {

    const data = docSnap.data();

    if (data.status === "active") {
      allFaucets.push({
        id: docSnap.id,
        ...data
      });
    }

  });

  // sort by rank
  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  document.getElementById("totalFaucets").innerHTML =
    `📊 ${allFaucets.length} Active Faucets`;

  render(allFaucets);
  renderCoinStats();
  loadCoinFilter();
  renderTrending();
}

/* =====================
   CLICK TRACKING + OPEN
===================== */
window.visitFaucet = async function (id, url) {

  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1)
    });
  } catch (err) {
    console.log(err);
  }

  window.open(url, "_blank");
};

/* =====================
   MAIN LIST RENDER
===================== */
function render(data) {

  let html = "";

  data.forEach((d) => {

    html += `
      <div class="card">

        <div class="rank-badge">
          #${d.rank || "-"}
        </div>

        <div class="name">
          ${d.name}
        </div>

        <div class="coin">
          ${d.coin}
        </div>

        <div class="clicks">
          👁 ${d.clicks || 0}
        </div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

/* =====================
   TRENDING FAUCETS
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);

  let html = "";

  top.forEach((d, i) => {

    html += `
      <div class="card">

        <div class="rank-badge">
          🔥 ${i + 1}
        </div>

        <div class="name">
          ${d.name}
        </div>

        <div class="coin">
          ${d.coin}
        </div>

        <div class="clicks">
          👁 ${d.clicks || 0}
        </div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>
    `;
  });

  document.getElementById("trending").innerHTML = html;
}

/* =====================
   COIN FILTER
===================== */
function loadCoinFilter() {

  const select = document.getElementById("coinFilter");

  if (!select) return;

  select.innerHTML = `<option value="all">All Coins</option>`;

  const coins = [...new Set(allFaucets.map(f => f.coin))];

  coins.sort();

  coins.forEach((coin) => {

    const option = document.createElement("option");
    option.value = coin;
    option.textContent = coin;

    select.appendChild(option);

  });
}

/* =====================
   COIN STATS
===================== */
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

/* =====================
   SEARCH
===================== */
window.searchPublic = function () {

  const q = document.getElementById("search").value.toLowerCase();

  const filtered = allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q)
  );

  render(filtered);
};

/* =====================
   FILTER COIN
===================== */
window.filterCoin = function () {

  const coin = document.getElementById("coinFilter").value;

  if (coin === "all") {
    render(allFaucets);
    return;
  }

  render(allFaucets.filter(f => f.coin === coin));
};

/* =====================
   INIT
===================== */
loadFaucets();