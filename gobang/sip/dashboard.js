import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const modalDiv = document.getElementById("editModal");
let allFaucets = [];

const showToast = (msg) => {
  toastDiv.textContent = msg;
  toastDiv.classList.add("show");
  setTimeout(() => toastDiv.classList.remove("show"), 2000);
};

async function loadFaucets(){
  try {
    const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
    const snap = await getDocs(q);
    allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render(allFaucets);
  } catch (err) {
    console.error("Gagal load:", err);
    listDiv.innerHTML = "Error load data. Cek Console F12 + Rules Firestore = true";
  }
}

function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "Belum ada data faucet.";
    return;
  }

  listDiv.innerHTML = data.map(d => {
    const active = d.status === "active";
    return `
      <div class="card">
        <span class="rank-badge">#${d.rank ?? '-'}</span>
        <span style="float:right;
          background:${active ? '#00ff88' : '#ff4d4d'};
          color:#000; padding:3px 8px; border-radius:6px; font-size:12px; font-weight:bold;">
          ${d.status}
        </span>

        <br><br>
        <b>${d.name}</b><br>
        Coin: ${d.coin}<br>
        <a href="${d.url}" target="_blank" class="claim-btn">Claim</a> <!-- GANTI VISIT JADI CLAIM -->

        <br><br>
        <button class="btn-edit" onclick='openEdit(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button>
        <button onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
        <button class="btn-delete" onclick="deleteFaucet('${d.id}')">Delete</button>
      </div>
    `;
  }).join("");
}

// ADD
window.addFaucet = async function(){
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  const rank = parseInt(document.getElementById("rank").value) || 99;

  if(!name || !url || !coin) return showToast("Isi Name, URL, Coin dulu");

  await addDoc(collection(db, "faucets"), { name, url, coin, status: "active", rank });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  document.getElementById("rank").value = "";
  showToast("Faucet ditambah");
  loadFaucets();
};

// DELETE
window.deleteFaucet = async function(id){
  if(!confirm("Yakin hapus?")) return;
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

// EDIT - BUKA MODAL
window.openEdit = function(data){
  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editRank").value = data.rank;
  document.getElementById("editStatus").value = data.status;
  modalDiv.classList.add("show");
};

// EDIT - TUTUP MODAL
window.closeModal = function(){
  modalDiv.classList.remove("show");
};

// EDIT - SIMPAN
window.saveEdit = async function(){
  const id = document.getElementById("editId").value;
  const data = {
    name: document.getElementById("editName").value.trim(),
    url: document.getElementById("editUrl").value.trim(),
    coin: document.getElementById("editCoin").value.trim().toUpperCase(),
    rank: parseInt(document.getElementById("editRank").value) || 99,
    status: document.getElementById("editStatus").value
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal();
  showToast("Data diupdate");
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
window.logout = () => signOut(auth).then(() => window.location.href = "login.html");

// Klik diluar modal = close
modalDiv.onclick = (e) => { if(e.target === modalDiv) closeModal(); }

loadFaucets();