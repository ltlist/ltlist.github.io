<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LTList Admin</title>
<style>
:root{--bg:#0f172a;--card:#1e293b;--muted:#94a3b8;--text:#f1f5f9;--green:#22c55e;--red:#ef4444;--yellow:#facc15;--blue:#3b82f6;}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,Segoe UI,Roboto;background:var(--bg);color:var(--text)}
.navbar{position:sticky;top:0;z-index:10;background:rgba(15,23,42,.8);backdrop-filter:blur(10px);padding:12px 20px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center}
.navbar.scrolled{box-shadow:0 4px 20px rgba(0,0,0,.3)}
.container{max-width:900px;margin:20px auto;padding:0 16px}
.card{background:var(--card);padding:16px;border-radius:12px;margin-bottom:12px;display:flex;gap:12px;align-items:center;border:1px solid #334155}
.card-left{display:flex;flex-direction:column;gap:6px;align-items:center;min-width:60px}
.card-mid{flex:1;min-width:0}
.card-title{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-sub{font-size:12px;color:var(--muted)}
.card-stats{font-size:12px;margin-top:4px}
.card-right{display:flex;gap:6px;flex-wrap:wrap}
.rank-badge{background:#334155;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:700}
.status-badge{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase}
.status-badge.active{background:rgba(34,197,94,.2);color:var(--green)}
.status-badge.inactive{background:rgba(239,68,68,.2);color:var(--red)}
.btn,button{padding:8px 12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-weight:600;font-size:14px}
.btn-delete{background:var(--red)}.btn-edit{background:var(--yellow);color:#000}
input,select{padding:10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:var(--text);width:100%}
.form-grid{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:20px}
.claim-btn{background:var(--green);text-decoration:none;padding:8px 14px;border-radius:8px;font-weight:700}
#toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(100px);background:#000;padding:12px 20px;border-radius:8px;opacity:0;transition:.3s;z-index:99}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:50}
.modal.show{display:flex}
.modal-content{background:var(--card);padding:20px;border-radius:12px;width:90%;max-width:400px}
.modal-content input,.modal-content select{margin-bottom:10px}
</style>
</head>
<body>

<div class="navbar">
  <h3>LTList Admin</h3>
  <button id="logoutBtn">Logout</button>
</div>

<div class="container">
  <div class="form-grid">
    <input id="name" placeholder="Nama Faucet">
    <input id="url" placeholder="URL Faucet">
    <input id="coin" placeholder="Coin: DOGE, LTC">
    <button id="addBtn">Tambah</button>
  </div>

  <div style="display:flex;gap:8px;margin-bottom:12px">
    <input id="search" placeholder="Cari nama, coin, rank...">
    <button id="rerankBtn">Rerank</button>
    <button id="publishBtn">Publish ke GitHub</button>
  </div>

  <div id="list"><p style="text-align:center;color:var(--muted)">Loading...</p></div>
</div>

<div id="toast"></div>

<div class="modal" id="editModal">
  <div class="modal-content">
    <h3>Edit Faucet</h3>
    <input type="hidden" id="editId">
    <input id="editName" placeholder="Nama">
    <input id="editUrl" placeholder="URL">
    <input id="editCoin" placeholder="Coin">
    <input id="editUptime" type="number" placeholder="Uptime %">
    <select id="editStatus"><option value="active">active</option><option value="inactive">inactive</option></select>
    <div style="display:flex;gap:8px">
      <button id="saveEditBtn">Simpan</button>
      <button id="closeModalBtn" style="background:#475569">Batal</button>
    </div>
  </div>
</div>

<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const UID_ADMIN = "gZPXqeKPBAZfCzYXEcrGWMcSFHI2"; // <-- WAJIB GANTI INI SESUAI UID KAMU DI FIREBASE AUTH

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
  setTimeout(() => toastDiv.classList.remove("show"), 2500);
};

function requireAdmin() {
  const user = auth.currentUser;
  if (!user || user.uid!== UID_ADMIN) {
    showToast("Akses ditolak. Bukan admin");
    return false;
  }
  return true;
}

async function loadFaucets(){
  if (!requireAdmin()) return;
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);
  allFaucets = snap.docs.map(d => ({ id: d.id,...d.data() }));
  render(allFaucets);
}

function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "<p style='text-align:center; color:var(--muted); padding:20px;'>Belum ada data faucet. Tambah di form atas.</p>";
    return;
  }
  listDiv.innerHTML = data.map(d => {
    const uptimeColor = d.uptime >= 90? 'var(--green)' : d.uptime >= 50? 'var(--yellow)' : 'var(--red)';
    return `
      <div class="card" data-id="${d.id}">
        <div class="card-left">
          <span class="rank-badge">#${d.rank?? '-'}</span>
          <span class="status-badge ${d.status}">${d.status}</span>
        </div>
        <div class="card-mid">
          <div class="card-title" title="${d.name}">${d.name}</div>
          <div class="card-sub">${d.coin}</div>
          <div class="card-stats">${d.clicks?? 0} claims | <span style="color:${uptimeColor}">${d.uptime?? 0}%</span></div>
        </div>
        <a href="${d.url}" target="_blank" rel="noopener" class="claim-btn" data-click="${d.id}">Claim</a>
        <div class="card-right">
          <button class="btn-edit" data-edit="${d.id}">Edit</button>
          <button data-move="${d.id}" data-dir="-1" title="Naikin">⬆️</button>
          <button data-move="${d.id}" data-dir="1" title="Turunin">⬇️</button>
          <button data-toggle="${d.id}" data-status="${d.status}">Toggle</button>
          <button class="btn-delete" data-delete="${d.id}">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
  attachEvents(); // Kasih event setelah render
}

function attachEvents() {
  listDiv.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => openEdit(allFaucets.find(f => f.id === btn.dataset.edit))));
  listDiv.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteFaucet(btn.dataset.delete)));
  listDiv.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', () => moveRank(btn.dataset.move, parseInt(btn.dataset.dir))));
  listDiv.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => toggleStatus(btn.dataset.toggle, btn.dataset.status)));
  listDiv.querySelectorAll('[data-click]').forEach(btn => btn.addEventListener('click', async (e) => {
    e.preventDefault();
    await addClick(btn.dataset.click);
    window.open(btn.href, '_blank');
  }));
}

async function moveRank(id, direction){
  if(!requireAdmin()) return;
  const idx = allFaucets.findIndex(f => f.id === id);
  const newIdx = idx + direction;
  if(newIdx < 0 || newIdx >= allFaucets.length) return;
  [allFaucets[idx], allFaucets[newIdx]] = [allFaucets[newIdx], allFaucets[idx]];
  allFaucets.forEach((f, i) => f.rank = i + 1);
  await Promise.all(allFaucets.map(f => updateDoc(doc(db, "faucets", f.id), { rank: f.rank })));
  showToast(`Rank diupdate`); render(allFaucets);
}
async function addClick(id){ if (requireAdmin()) await updateDoc(doc(db, "faucets", id), { clicks: increment(1) }); }
async function addFaucet(){
  if(!requireAdmin()) return;
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name ||!url ||!coin) return showToast("Isi Nama, URL, Coin dulu");
  const nextRank = allFaucets.length + 1;
  await addDoc(collection(db, "faucets"), { name, url, coin, status: "active", rank: nextRank, uptime: 100, clicks: 0 });
  document.getElementById("name").value = ""; document.getElementById("url").value = ""; document.getElementById("coin").value = "";
  showToast(`Ditambah. Rank: #${nextRank}`); loadFaucets();
}
async function deleteFaucet(id){
  if(!requireAdmin() ||!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus. Merapikan rank..."); await rerank(true);
}
async function toggleStatus(id, status){
  if(!requireAdmin()) return;
  const newStatus = status === "active"? "inactive" : "active";
  await updateDoc(doc(db, "faucets", id), { status: newStatus, uptime: newStatus === "active"? 100 : 0 });
  showToast(`Status: ${newStatus}`); loadFaucets();
}
function openEdit(data){
  if(!requireAdmin() ||!data) return;
  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editStatus").value = data.status;
  document.getElementById("editUptime").value = data.uptime?? 0;
  modalDiv.classList.add("show");
}
function closeModal(){ modalDiv.classList.remove("show"); }
async function saveEdit(){
  if(!requireAdmin()) return;
  const id = document.getElementById("editId").value;
  const data = {
    name: document.getElementById("editName").value.trim(),
    url: document.getElementById("editUrl").value.trim(),
    coin: document.getElementById("editCoin").value.trim().toUpperCase(),
    uptime: parseInt(document.getElementById("editUptime").value) || 0,
    status: document.getElementById("editStatus").value
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal(); showToast("Diupdate"); loadFaucets();
}
async function rerank(auto = false){
  if(!requireAdmin()) return;
  if(!auto &&!confirm("Urutkan ulang rank 1,2,3...?")) return;
  allFaucets.forEach((f, i) => f.rank = i + 1);
  await Promise.all(allFaucets.map(f => updateDoc(doc(db, "faucets", f.id), { rank: f.rank })));
  showToast(auto? "Rank auto dirapikan" : "Rank sudah diurutkan ulang"); loadFaucets();
}
function searchFaucet(){
  const v = document.getElementById("search").value.toLowerCase();
  render(allFaucets.filter(f => f.name.toLowerCase().includes(v) || f.coin.toLowerCase().includes(v) || String(f.rank).includes(v)));
}
const logout = () => signOut(auth).then(() => window.location.href = "login.html");

modalDiv.onclick = (e) => { if(e.target === modalDiv) closeModal(); }
window.addEventListener('scroll', () => document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10));

// Event Listener Semua Tombol
document.getElementById("addBtn").addEventListener("click", addFaucet);
document.getElementById("rerankBtn").addEventListener("click", () => rerank(false));
document.getElementById("publishBtn").addEventListener("click", publishBtn);
document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("search").addEventListener("input", searchFaucet);
document.getElementById("logoutBtn").addEventListener("click", logout);

const WORKER_URL = "https://misty-truth-00e3.cnamelist.workers.dev/publish";
async function publishBtn(){
  if(!requireAdmin() ||!confirm("Yakin publish semua data faucet ke cards.json GitHub?")) return;
  showToast("Mengirim ke GitHub...");
  try{
    const res = await fetch(WORKER_URL, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(allFaucets) });
    const result = await res.json();
    showToast(result.success? "✅ Berhasil publish cards.json" : "❌ Gagal: " + result.error);
  } catch(err){ showToast("❌ Error koneksi Worker"); }
}

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid!== UID_ADMIN) {
    if(user) await signOut(auth);
    alert("Akses ditolak. Login sebagai admin dulu.");
    window.location.href = "login.html";
    return;
  }
  console.log("ADMIN LOGIN:", user.uid);
  await loadFaucets();
});
</script>
</body>
</html>