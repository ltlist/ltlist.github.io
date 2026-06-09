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
  apiKey: "AIzaSyAVokWJ_l3aITEhj6UPetF-MGQXKDV75S8",
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

// LOAD
async function loadFaucets(){

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    allFaucets.push({ id: d.id, ...d.data() });
  });

  render(allFaucets);
}

// RENDER ADMIN
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
          border-radius:6px;">
          ${d.status}
        </span>

        <br><br>

        Coin: ${d.coin}<br>
        <a href="${d.url}" target="_blank">Visit</a>

        <br><br>

        <button onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
        <button onclick="deleteFaucet('${d.id}')">Delete</button>
      </div>
    `;
  });

  listDiv.innerHTML = html;
}

// ADD
window.addFaucet = async function(){

  const name = document.getElementById("name").value;
  const url = document.getElementById("url").value;
  const coin = document.getElementById("coin").value;

  await addDoc(collection(db, "faucets"), {
    name,
    url,
    coin,
    status: "active"
  });

  loadFaucets();
};

// DELETE
window.deleteFaucet = async function(id){
  await deleteDoc(doc(db, "faucets", id));
  loadFaucets();
};

// TOGGLE
window.toggleStatus = async function(id, status){

  const newStatus = status === "active" ? "inactive" : "active";

  await updateDoc(doc(db, "faucets", id), {
    status: newStatus
  });

  loadFaucets();
};

// SEARCH
window.searchFaucet = function(){

  const v = document.getElementById("search").value.toLowerCase();

  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v)
  );

  render(filtered);
};

// LOGOUT
window.logout = function(){
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};

// INIT
loadFaucets();