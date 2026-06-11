import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, increment
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
    listDiv.innerHTML = "Error load data. Cek Console F12 + Rules Firestore";
  }
}

// RENDER VERSI RAPI PAKAI GRID
function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:var(--muted);'>Belum ada data faucet.</p>";
    return;
  }

  listDiv.innerHTML = data.map(d => {
    const uptimeColor = d.uptime >= 90 ? 'var(--green)' : d.uptime >= 50 ? 'var(--yellow)' : 'var(--red)';
    return `
      <div class="card">
        <div class="card-head">
          <span class="rank-badge">#${d.rank ?? '-'}</span>
          <span class="status-badge ${d.status}">${d.status}</span>
        </div>
        
        <div class="card-title">${d.name}</div>
        <div class="card-sub">Coin: ${d.coin}</div>
        
        <a href="${d.url}" target="_blank" rel="noopener" class="claim-btn" onclick="addClick('${d.id}')">Claim</a>

        <div class="stat-line">
          ${d.clicks ?? 0} Claims | Uptime: <span style="color:${uptimeColor}; font-weight:bold;">${d.uptime ?? 0}%</span>
        </div>

        <div class="card-actions">
          <button class="btn-edit" onclick='openEdit(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button>
          <button onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
          <button class="btn-delete" onclick="deleteFaucet('${d.id}')">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
}

// LOGIKA CRUD TETAP SAMA
window.addClick = async function(id){
  await updateDoc(doc(db, "faucets", id), { clicks: increment(1) });
};

window.addFaucet = async function(){
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name || !url || !coin) return showToast("Isi Nama, URL, Coin dulu");

  const snap = await getDocs(collection(db, "faucets"));
  const nextRank = snap.size + 1;
  await addDoc(collection(db, "faucets"), { 
    name, url, coin, status: "active", rank: nextRank, uptime: 100, clicks: 0
  });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  showToast(`Faucet ditambah. Rank auto: #${nextRank}`);
  loadFaucets();
};

window.deleteFaucet = async function(id){
  if(!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus");
  loadFaucets();
};

window.toggleStatus = async function(id, status){
  const newStatus = status === "active" ? "inactive" : "active";
  const newUptime = newStatus === "active" ? 100 : 0;
  await updateDoc(doc(db, "faucets", id), { status: newStatus, uptime: newUptime });
  showToast(`Status: ${newStatus} | Uptime: ${newUptime}%`);
  loadFaucets();
};

window.openEdit = function(data){
  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editUptime").value = data.uptime;
  document.getElementById("editStatus").value = data.status;
  modalDiv.classList.add("show");
};

window.closeModal = function(){ modalDiv.classList.remove("show"); };

window.saveEdit = async function(){
  const id = document.getElementById("editId").value;
  const data = {
    name: document.getElementById("editName").value.trim(),
    url: document.getElementById("editUrl").value.trim(),
    coin: document.getElementById("editCoin").value.trim().toUpperCase(),
    uptime: parseInt(document.getElementById("editUptime").value) || 0,
    status: document.getElementById("editStatus").value
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal();
  showToast("Data diupdate");
  loadFaucets();
};

window.rerank = async function(){
  if(!confirm("Yakin urutkan ulang rank jadi 1,2,3...?")) return;
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);
  let i = 1;
  for(const d of snap.docs){
    await updateDoc(doc(db, "faucets", d.id), { rank: i++ });
  }
  showToast("Rank sudah diurutkan ulang");
  loadFaucets();
};

window.searchFaucet = function(){
  const v = document.getElementById("search").value.toLowerCase();
  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v) ||
    String(f.rank).includes(v)
  );
  render(filtered);
};

window.logout = () => signOut(auth).then(() => window.location.href = "login.html");

modalDiv.onclick = (e) => { if(e.target === modalDiv) closeModal(); }

// NAVBAR SHADOW PAS SCROLL
window.addEventListener('scroll', () => {
  document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 10);
});

loadFaucets();