import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

const listDiv = document.getElementById("list");

let allFaucets = [];

// ======================
// LOAD FAUCETS
// ======================
async function loadFaucets(){

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    allFaucets.push({
      id: d.id,
      ...d.data()
    });
  });

  // urut berdasarkan rank
  allFaucets.sort((a,b) =>
    (a.rank || 9999) - (b.rank || 9999)
  );

  render(allFaucets);
}

// ======================
// RENDER
// ======================
function render(data){

  let html = "";

  data.forEach((d) => {

    const active = d.status === "active";

    html += `
      <div class="card">

        <div class="rank-badge">
          #${d.rank || "-"}
        </div>

        <b>${d.name}</b>

        <span style="
          float:right;
          background:${active ? '#00ff88' : '#ff4d4d'};
          color:#000;
          padding:4px 8px;
          border-radius:6px;
          font-size:12px;
          font-weight:bold;
        ">
          ${d.status}
        </span>

        <br><br>

        Coin: ${d.coin}<br>

        <a href="${d.url}" target="_blank">
          Visit
        </a>

        <br><br>

        <button onclick="editFaucet(
          '${d.id}',
          '${d.name}',
          '${d.url}',
          '${d.coin}',
          '${d.rank || 0}'
        )">
          Edit
        </button>

        <button onclick="toggleStatus(
          '${d.id}',
          '${d.status}'
        )">
          Toggle
        </button>

        <button onclick="deleteFaucet(
          '${d.id}'
        )">
          Delete
        </button>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

// ======================
// ADD
// ======================
window.addFaucet = async function(){

  const name = document.getElementById("name").value;
  const url = document.getElementById("url").value;
  const coin = document.getElementById("coin").value;
  const rank = Number(
    document.getElementById("rank").value
  );

  if(!name || !url || !coin){
    alert("Lengkapi data");
    return;
  }

  await addDoc(collection(db, "faucets"), {
    name,
    url,
    coin,
    rank,
    status: "active"
  });

  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  document.getElementById("rank").value = "";

  loadFaucets();
};

// ======================
// EDIT
// ======================
window.editFaucet = async function(
  id,
  name,
  url,
  coin,
  rank
){

  const newName = prompt(
    "Name",
    name
  );

  if(newName === null) return;

  const newUrl = prompt(
    "URL",
    url
  );

  if(newUrl === null) return;

  const newCoin = prompt(
    "Coin",
    coin
  );

  if(newCoin === null) return;

  const newRank = prompt(
    "Rank",
    rank
  );

  if(newRank === null) return;

  await updateDoc(
    doc(db, "faucets", id),
    {
      name: newName,
      url: newUrl,
      coin: newCoin,
      rank: Number(newRank)
    }
  );

  loadFaucets();
};

// ======================
// DELETE
// ======================
window.deleteFaucet = async function(id){

  if(!confirm("Delete faucet?")){
    return;
  }

  await deleteDoc(
    doc(db, "faucets", id)
  );

  loadFaucets();
};

// ======================
// TOGGLE STATUS
// ======================
window.toggleStatus = async function(
  id,
  status
){

  const newStatus =
    status === "active"
    ? "inactive"
    : "active";

  await updateDoc(
    doc(db, "faucets", id),
    {
      status: newStatus
    }
  );

  loadFaucets();
};

// ======================
// SEARCH
// ======================
window.searchFaucet = function(){

  const q = document
    .getElementById("search")
    .value
    .toLowerCase();

  const filtered =
    allFaucets.filter(f =>

      f.name.toLowerCase().includes(q) ||

      f.coin.toLowerCase().includes(q)

    );

  render(filtered);
};

// ======================
// LOGOUT
// ======================
window.logout = function(){

  signOut(auth)
  .then(() => {

    window.location.href =
      "login.html";

  });

};

// ======================
// INIT
// ======================
loadFaucets();