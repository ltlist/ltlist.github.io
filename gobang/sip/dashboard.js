import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, increment
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

// 1. ISI UID KAMU DI SINI DOANG
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
  if (!user || user.uid !== UID_ADMIN) {
    showToast("Akses ditolak. Bukan admin");
    return false;
  }
  return true;
}

async function loadFaucets(){
  if (!requireAdmin()) return;
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);
  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(allFaucets);
}

function render(data){
  if(data.length === 0){
    listDiv.innerHTML = "<p style='text-align:center; color:var(--muted); padding:20px;'>Belum ada data faucet.</p>";
    return;
  }
  listDiv.innerHTML = data.map(d => {
    return `
      <div class="card">
        <div class="card-left">
          <span class="rank-badge">#${d.rank ?? '-'}</span>
          <span class="status-badge ${d.status}">${d.status}</span>
        </div>
        <div class="card-mid">
          <div class="card-title" title="${d.name}">${d.name}</div>
          <div class="card-sub">${d.coin}</div>
          <div class="card-stats">${d.clicks ?? 0} claims</div> <!-- UPTIME DIBUANG -->
        </div>
        <a href="${d.url}" target="_blank" rel="noopener" class="claim-btn" onclick="addClick('${d.id}')">Claim</a>
        <div class="card-right">
          <button class="btn-edit" onclick='openEdit(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button>
          <button onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
          <button class="btn-delete" onclick="deleteFaucet('${d.id}')">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
}

// PENTING: Sekarang pake /api/click biar ada rate limit 60mnt/IP
window.addClick = async function(id){
  if (!requireAdmin()) return;
  const res = await fetch('/api/click', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id})
  });
  const data = await res.json();
  if(!res.ok) return showToast(data.error); // "Tunggu 42 menit lagi"
  window.open(document.querySelector(`a[onclick*="${id}"]`).href, '_blank'); // Buka link setelah lolos
  loadFaucets(); // Refresh jumlah claims
};

window.addFaucet = async function(){
  if(!requireAdmin()) return; 
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name || !url || !coin) return showToast("Isi Nama, URL, Coin dulu");

  const snap = await getDocs(collection(db, "faucets"));
  const nextRank = snap.size + 1;
  await addDoc(collection(db, "faucets"), { 
    name, url, coin, status: "active", rank: nextRank, clicks: 0 // UPTIME DIBUANG
  });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  showToast(`Ditambah. Rank: #${nextRank}`);
  loadFaucets();
};

window.deleteFaucet = async function(id){
  if(!requireAdmin()) return; 
  if(!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus. Merapikan rank...");
  await rerank(true);
};

window.toggleStatus = async function(id, status){
  if(!requireAdmin()) return; 
  const newStatus = status === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "faucets", id), { status: newStatus }); // UPTIME DIBUANG
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
  // document.getElementById("editUptime").value = data.uptime; // DIBUANG
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
    // uptime: ... // DIBUANG
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal();
  showToast("Diupdate");
  loadFaucets();
};

window.rerank = async function(auto = false){
  if(!requireAdmin()) return; 
  if(!auto){
    if(!confirm("Urutkan ulang rank 1,2,3...?")) return;
  }
  
  const snap = await getDocs(query(collection(db, "faucets"), orderBy("rank", "asc")));
  if(snap.empty) return loadFaucets();

  let i = 1;
  const updates = snap.docs.map(d => updateDoc(doc(db, "faucets", d.id), { rank: i++ }));
  await Promise.all(updates);
  
  showToast(auto ? "Rank auto dirapikan" : "Rank sudah diurutkan ulang");
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
window.addEventListener('scroll', () => {
  document.querySelector('.navbar')?.classList.toggle('scrolled', window.scrollY > 10);
});

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== UID_ADMIN) {
    if(user) await signOut(auth);
    window.location.href = "login.html";
    return;
  }
  console.log("ADMIN LOGIN:", user.uid);
  await loadFaucets();
});