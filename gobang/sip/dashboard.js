import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// GANTI DENGAN CONFIG KAMU
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
const toastDiv = document.getElementById("toast");
let allFaucets = [];

// TOAST NOTIF
function showToast(msg){
  toastDiv.textContent = msg;
  toastDiv.classList.add("show");
  setTimeout(() => toastDiv.classList.remove("show"), 2000);
}

// LOAD + SORT RANK KECIL -> BESAR
async function loadFaucets(){
  try {
    const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
    const snap = await getDocs(q);

    allFaucets = [];
    snap.forEach((d) => {
      allFaucets.push({ id: d.id, ...d.data() });
    });
    render(allFaucets);
  } catch (err) {
    console.error("Gagal load:", err);
    listDiv.innerHTML = "Error load data. Cek Console F12. Kemungkinan Rules Firestore masih false.";
  }
}

// RENDER ADMIN
function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "Belum ada data faucet. Tambah di form bawah.";
    return;
  }

  let html = "";
  data.forEach((d) => {
    const active = d.status === "active";
    html += `
      <div class="card">
        <span class="rank-badge">#${d.rank ?? '-'}</span>
        
        <span style="float:right;
          background:${active ? '#00ff88' : '#ff4d4d'};
          color:#000;
          padding:3px 8px;
          border-radius:6px;
          font-size:12px;
          font-weight:bold;">
          ${d.status}
        </span>

        <br><br>
        <b>${d.name}</b><br>
        Coin: ${d.coin}<br>
        <a href="${d.url}" target="_blank" class="visit-btn">${d.url}</a>

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
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  const rank = parseInt(document.getElementById("rank").value) || 99;

  if(!name || !url || !coin) {
    showToast("Isi Name, URL, Coin dulu");
    return;
  }

  await addDoc(collection(db, "faucets"), {
    name, url, coin, status: "active", rank: rank // int64
  });

  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  document.getElementById("rank").value = "";
  
  showToast("Faucet ditambah");
  loadFaucets();
};

// DELETE
window.deleteFaucet = async function(id){
  if(!confirm("Yakin hapus faucet ini?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus");
  loadFaucets();
};

// TOGGLE
window.toggleStatus = async function(id, status){
  const newStatus = status === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "faucets", id), { status: newStatus });
  showToast(`Status jadi ${newStatus}`);
  loadFaucets();
};

// SEARCH
window.searchFaucet = function(){
  const v = document.getElementById("search").value.toLowerCase();
  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v) ||
    String(f.rank).includes(v)
  );
  render(filtered);
};

// LOGOUT
window.logout = function(){
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch(err => {
    console.error(err);
    window.location.href = "login.html"; // force redirect
  });
};

// INIT
loadFaucets();