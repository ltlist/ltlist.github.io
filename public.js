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
   FIREBASE
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
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(
    collection(db, "faucets")
  );

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

  allFaucets.sort(
    (a, b) =>
      (a.rank || 9999) -
      (b.rank || 9999)
  );

  document.getElementById(
    "totalFaucets"
  ).innerHTML =
    `📊 ${allFaucets.length} Active Faucets`;

  render(allFaucets);
  renderCoinStats();
  loadCoinFilter();
}

/* =====================
   CLICK TRACKING
===================== */
window.visitFaucet =
async function(id, url) {

  try {

    await updateDoc(
      doc(db, "faucets", id),
      {
        clicks: increment(1)
      }
    );

  } catch(err) {

    console.log(err);

  }

  window.open(url, "_blank");
};

/* =====================
   RENDER LIST
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
          👁 ${d.clicks || 0} Clicks
        </div>

        <a
          href="#"
          class="visit-btn"
          onclick="visitFaucet('${d.id}','${d.url}')"
        >
          Claim
        </a>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

/* =====================
   COIN FILTER
===================== */
function loadCoinFilter() {

  const select =
    document.getElementById(
      "coinFilter"
    );

  select.innerHTML =
    `<option value="all">All Coins</option>`;

  const coins = [
    ...new Set(
      allFaucets.map(
        f => f.coin
      )
    )
  ];

  coins.sort();

  coins.forEach((coin) => {

    const option =
      document.createElement(
        "option"
      );

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

    count[f.coin] =
      (count[f.coin] || 0) + 1;

  });

  let html = "";

  Object.keys(count)
    .sort()
    .forEach((coin) => {

      html += `
        <span class="badge">
          ${coin} (${count[coin]})
        </span>
      `;

    });

  document.getElementById(
    "coinStats"
  ).innerHTML = html;
}

/* =====================
   SEARCH
===================== */
window.searchPublic =
function() {

  const q =
    document
      .getElementById("search")
      .value
      .toLowerCase();

  const filtered =
    allFaucets.filter(
      f =>
        f.name
          .toLowerCase()
          .includes(q)
    );

  render(filtered);
};

/* =====================
   FILTER COIN
===================== */
window.filterCoin =
function() {

  const coin =
    document.getElementById(
      "coinFilter"
    ).value;

  if (coin === "all") {

    render(allFaucets);
    return;

  }

  const filtered =
    allFaucets.filter(
      f => f.coin === coin
    );

  render(filtered);
};

/* =====================
   INIT
===================== */
loadFaucets();