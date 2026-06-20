<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, increment
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
    listDiv.innerHTML = "<p style='text-align:center; color:var(--muted); padding:20px;'>Belum ada data faucet.</p>";
    return;
  }
  // 1. Render HTML doang. GAK ADA ONCLICK LAGI
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

  // 2. Kasih event listener setelah HTML nya masuk
  attachEvents();
}

function attachEvents() {
  listDiv.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.edit;
      const data = allFaucets.find(f => f.id === id);
      openEdit(data);
    });
  });
  listDiv.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteFaucet(btn.dataset.delete));
  });
  listDiv.querySelectorAll('[data-move]').forEach(btn => {
    btn.addEventListener('click', () => moveRank(btn.dataset.move, parseInt(btn.dataset.dir)));
  });
  listDiv.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => toggleStatus(btn.dataset.toggle, btn.dataset.status));
  });
  listDiv.querySelectorAll('[data-click]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // biar gak langsung pindah halaman
      addClick(btn.dataset.click);
      window.open(btn.href, '_blank'); // baru buka tab baru
    });
  });
}

async function moveRank(id, direction){
  if(!requireAdmin()) return;
  const idx = allFaucets.findIndex(f => f.id === id);
  if(idx === -1) return;
  const newIdx = idx + direction;
  if(newIdx < 0 || newIdx >= allFaucets.length) return;

  [allFaucets[idx], allFaucets[newIdx]] = [allFaucets[newIdx], allFaucets[idx]];
  allFaucets.forEach((f, i) => f.rank = i + 1);

  const updates = allFaucets.map(f => updateDoc(doc(db, "faucets", f.id), { rank: f.rank }));
  await Promise.all(updates);

  showToast(`Rank diupdate`);
  render(allFaucets);
}

async function addClick(id){
  if (!requireAdmin()) return;
  await updateDoc(doc(db, "faucets", id), { clicks: increment(1) });
}

async function addFaucet(){
  if(!requireAdmin()) return;
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name ||!url ||!coin) return showToast("Isi Nama, URL, Coin dulu");

  const snap = await getDocs(collection(db, "faucets"));
  const nextRank = snap.size + 1;
  await addDoc(collection(db, "faucets"), {
    name, url, coin, status: "active", rank: nextRank, uptime: 100, clicks: 0
  });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  showToast(`Ditambah. Rank: #${nextRank}`);
  loadFaucets();
}

async function deleteFaucet(id){
  if(!requireAdmin()) return;
  if(!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus. Merapikan rank...");
  await rerank(true);
}

async function toggleStatus(id, status){
  if(!requireAdmin()) return;
  const newStatus = status === "active"? "inactive" : "active";
  const newUptime = newStatus === "active"? 100 : 0;
  await updateDoc(doc(db, "faucets", id), { status: newStatus, uptime: newUptime });
  showToast(`Status: ${newStatus}`);
  loadFaucets();
}

function openEdit(data){
  if(!requireAdmin()) return;
  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editStatus").value = data.status;
  document.getElementById("editUptime").value = data.uptime?? 0;
  modalDiv.classList.add("show");
}

function closeModal(){ modalDiv.classList.remove("show"); };

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
  closeModal();
  showToast("Diupdate");
  loadFaucets();
}

async function rerank(auto = false){
  if(!requireAdmin()) return;
  if(!auto){
    if(!confirm("Urutkan ulang rank 1,2,3...?")) return;
  }
  let i = 1;
  const updates = allFaucets.map(d => updateDoc(doc(db, "faucets", d.id), { rank: i++ }));
  await Promise.all(updates);
  showToast(auto? "Rank auto dirapikan" : "Rank sudah diurutkan ulang");
  loadFaucets();
}

function searchFaucet(){
  const v = document.getElementById("search").value.toLowerCase();
  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v) ||
    String(f.rank).includes(v)
  );
  render(filtered);
}

function logout(){ signOut(auth).then(() => window.location.href = "login.html"); }

modalDiv.onclick = (e) => { if(e.target === modalDiv) closeModal(); }
window.addEventListener('scroll', () => {
  document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10);
});

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid!== UID_ADMIN) {
    if(user) await signOut(auth);
    window.location.href = "login.html";
    return;
  }
  console.log("ADMIN LOGIN:", user.uid);
  await loadFaucets();
});

// === TOMBOL 2 AJA === //
const WORKER_URL = "https://misty-truth-00e3.cnamelist.workers.dev/publish";

document.getElementById("publishBtn").addEventListener("click", publishBtn); // Tombol 1
document.getElementById("rerankBtn").addEventListener("click", () => rerank(false)); // Tombol 2
document.getElementById("addBtn").addEventListener("click", addFaucet);
document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("search").addEventListener("input", searchFaucet);
document.getElementById("logoutBtn").addEventListener("click", logout);

async function publishBtn(){
  if(!requireAdmin()) return;
  if(!confirm("Yakin publish semua data faucet ke cards.json GitHub?")) return;

  showToast("Mengirim ke GitHub...");

  try{
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(allFaucets)
    });
    const result = await res.json();
    if(result.success){
      showToast("✅ Berhasil publish cards.json");
    } else {
      showToast("❌ Gagal: " + JSON.stringify(result.error));
    }
  } catch(err){
    showToast("❌ Error koneksi Worker");
  }
}
</script>