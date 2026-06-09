import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_l3aITEhj6UPetF-MGQXKDV75S8",
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

// =====================
// LOAD DATA
// =====================
async function loadFaucets(){

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((doc) => {
    allFaucets.push(doc.data());
  });

  render(allFaucets);

  loadCoinFilter(); // 🔥 AUTO COIN FILTER
}

// =====================
// RENDER
// =====================
function render(data){

  let html = "";

  data.forEach((d) => {

    const active = d.status === "active";

    html += `
      <div class="card">
        <b>${d.name}</b>

        <span style="float:right;
          background:${active ? '#00ff88' : '#ff4d4d'};
          padding:3px 8px;
          border-radius:6px;
          font-size:12px;">
          ${d.status}
        </span>

        <br><br>

        Coin: ${d.coin}<br><br>

        <a href="${d.url}" target="_blank">Visit</a>
      </div>
    `;
  });

  listDiv.innerHTML = html;
}

// =====================
// AUTO COIN FILTER
// =====================
function loadCoinFilter(){

  const select = document.getElementById("coinFilter");

  // reset dulu (biar tidak double)
  select.innerHTML = `<option value="all">All Coin</option>`;

  const coins = [...new Set(allFaucets.map(f => f.coin))];

  coins.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

// =====================
// SEARCH
// =====================
window.searchPublic = function(){

  const v = document.getElementById("search").value.toLowerCase();

  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v)
  );

  render(filtered);
};

// =====================
// FILTER COIN
// =====================
window.filterCoin = function(){

  const coin = document.getElementById("coinFilter").value;

  if(coin === "all"){
    render(allFaucets);
    return;
  }

  const filtered = allFaucets.filter(f => f.coin === coin);

  render(filtered);
};

// INIT
loadFaucets();