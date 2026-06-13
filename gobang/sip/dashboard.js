import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const UID_ADMIN = "gZPXqeKPBAZfCzYXEcrGWMcSFHI2"; 
const API_URL = "https://misty-truth-00e3.cnamelist.workers.dev";

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

function requireAdmin() {
  const user = auth.currentUser;
  if (!user || user.uid !== UID_ADMIN) {
    showToast("Akses ditolak. Bukan admin");
    return false;
  }
  return true;
}

async function loadFaucets(){
  if (!requireAdmin()) return;
  const snap = await getDocs(collection(db, "faucets")); 
  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() })); // UDAH GAK AMBIL CLICKS DARI KV
  rerank(); // Rank tetep ada, urut dari field `rank` di Firestore
}

function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "<p style='text-align:center; color:var(--muted); padding:20px;'>Belum ada data faucet.</p>";
    return;
  }
  listDiv.innerHTML = data.map((d) => {
    return `
      <div class="card">
        <div class="card-left">
          <span class="rank-badge">#${d.rank}</span> <!-- RANK TETAP ADA -->
          <span class="status-badge ${d.status}">${d.status}</span> <!-- STATUS TETAP ADA -->
        </div>
        <div class="card-mid">
          <div class="card-title" title="${d.name}">${d.name}</div>
          <div class="card-sub">${d.coin}</div>
          <div class="card-stats">Min: ${d.min || '-'}</div> <!-- INI YANG DIHAPUS: ${d.clicks ?? 0} claims -->
        </div>
        <a href="${d.url}" target="_blank" rel="noopener" class="claim-btn" onclick="addClick('${d.id}')">Claim</a>
        <div class="card-right">
          <button class="btn-edit" onclick='openEdit(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button> <!-- BIRU -->
          <button onclick="toggleStatus('${d.id}','${d.status}')" style="background:var(--yellow); color:#000;">Toggle</button> <!-- KUNING -->
          <button class="btn-delete" onclick="deleteFaucet('${d.id}')">Hapus</button> <!-- MERAH -->
        </div>
      </div>
    `;
  }).join("");
}

window.addClick = async function(id){
  if (!requireAdmin()) return;
  const res = await fetch(`${API_URL}/api/click`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id})
  });
  const data = await res.json();
  if(!res.ok) return showToast(data.error);
  window.open(document.querySelector(`a[onclick*="${id}"]`).href, '_blank');
  // loadFaucets(); DIHAPUS, biar gak refresh angka clicks
};

window.addFaucet = async function(){
  if(!requireAdmin()) return; 
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name || !url || !coin) return showToast("Isi Nama, URL, Coin dulu");

  const nextRank = allFaucets.length + 1;
  await addDoc(collection(db, "faucets"), { 
    name, url, coin, rank: nextRank, status: "active" // CLICKS DIHAPUS
  });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  showToast(`Ditambah`);
  loadFaucets();
};

window.deleteFaucet = async function(id){
  if(!requireAdmin()) return; 
  if(!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus.");
  loadFaucets();
  rerank();
};

window.toggleStatus = async function(id, status){
  if(!requireAdmin()) return; 
  const newStatus = status === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "faucets", id), { status: newStatus }); 
  showToast(`Status: ${newStatus}`);
  loadFaucets();
};

window.openEdit = function(data){
  if(!requireAdmin()) return; 
  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editStatus").value = data.status;
  modalDiv.classList.add("show");
};

window.closeModal = function(){ modalDiv.classList.remove("show"); };

window.saveEdit = async function(){
  if(!requireAdmin()) return; 
  const id = document.getElementById("editId").value;
  const data = {
    name: document.getElementById("editName").value.trim(),
    url: document.getElementById("editUrl").value.trim(),
    coin: document.getElementById("editCoin").value.trim().toUpperCase(),
    status: document.getElementById("editStatus").value
    // clicks: DIHAPUS
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal();
  showToast("Diupdate");
  loadFaucets();
};

async function rerank(){ // RANK TETAP JALAN
  allFaucets.sort((a,b) => (a.rank || 999) - (b.rank || 999));
  const batch = [];
  allFaucets.forEach((f, i) => {
    if(f.rank !== i + 1) batch.push(updateDoc(doc(db, "faucets", f.id), {rank: i+1}));
  });
  await Promise.all(batch);
  render(allFaucets);
}

window.searchFaucet = function(){
  const v = document.getElementById("search").value.toLowerCase();
  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v)
  );
  render(filtered);
};

window.logout = () => signOut(auth).then(() => window.location.href = "login.html");

modalDiv.onclick = (e) => { if(e.target === modalDiv) closeModal(); }

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== UID_ADMIN) {
    if(user) await signOut(auth);
    window.location.href = "login.html";
    return;
  }
  await loadFaucets();
});