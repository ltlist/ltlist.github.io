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
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKDV75S8",
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
   DEVICE ID
===================== */
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

/* =====================
   ANTI CLICK SPAM (LOCAL)
===================== */
function canClick(id) {
  const last = localStorage.getItem("click_" + id);
  if (!last) return true;

  const diff = Date.now() - Number(last);
  return diff > 5000; // 5 detik cooldown
}

function setClick(id) {
  localStorage.setItem("click_" + id, Date.now());
}

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

  // ANTI BOT CHECK
  if (!canClick(id)) {
    alert("Tunggu beberapa detik sebelum klik lagi!");
    return;
  }

  setClick(id);

  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1),
      lastClickAt: Date.now(),
      deviceId: getDeviceId()
    });
  } catch (err) {
    console.log(err);
  }

  window.open(url, "_blank");
};

/* =====================
   RENDER MAIN LIST
===================== */
function render(data) {

  if (!listDiv) return;

  listDiv.innerHTML = data.map(d => `
    <div class="card">

      <!-- TOP -->
      <div class="top-row">

        <div class="rank">
          #${d.rank || "-"}
        </div>

        <div class="coin">
          ${d.coin || "-"}
        </div>

        <div class="score">
          ⭐ ${calcScore(d)}
        </div>

      </div>

      <!-- NAME -->
      <div class="name">
        ${d.name}
      </div>

      <!-- ACTION -->
      <div class="bottom-row">

        <div class="vote">
          👍 ${d.likes || 0} | 👎 ${d.dislikes || 0}
        </div>

        <a class="visit-btn"
           href="#"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>

    </div>
  `).join("");
}

/* =====================
   TRENDING
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);

  let html = "";

  top.forEach((d, i) => {

    html += `
      <div class="card">

        <div class="rank-badge">🔥 ${i + 1}</div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">👁 ${d.clicks || 0}</div>

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

  allFaucets.forEach(f => {
    count[f.coin] = (count[f.coin] || 0) + 1;
  });

  let html = "";

  Object.keys(count).sort().forEach(coin => {
    html += `<span class="badge">${coin} (${count[coin]})</span>`;
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