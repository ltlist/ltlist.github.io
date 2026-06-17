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

// FUNGSI KUNCI BARU: Cek login + Cek UID
function requireAdmin() {
  const user = auth.currentUser;
  if (!user || user.uid !== UID_ADMIN) { // <- Cek UID di sini juga
    showToast("Akses ditolak. Bukan admin");
    return false;
  }
  return true;
}

async function loadFaucets(){
  if (!requireAdmin()) return; // cegah load kalo bukan admin
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
    const uptimeColor = d.uptime >= 90 ? 'var(--green)' : d.uptime >= 50 ? 'var(--yellow)' : 'var(--red)';
    return `
      <div class="card">
        <div class="card-left">
          <span class="rank-badge">#${d.rank ?? '-'}</span>
          <span class="status-badge ${d.status}">${d.status}</span>
        </div>
        <div class="card-mid">
          <div class="card-title" title="${d.name}">${d.name}</div>
          <div class="card-sub">${d.coin}</div>
          <div class="card-stats">${d.clicks ?? 0} claims | <span style="color:${uptimeColor}">${d.uptime ?? 0}%</span></div>
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

window.addClick = async function(id){
  if (!requireAdmin()) return;
  await updateDoc(doc(db, "faucets", id), { clicks: increment(1) });
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
    name, url, coin, status: "active", rank: nextRank, uptime: 100, clicks: 0
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
  const newUptime = newStatus === "active" ? 100 : 0;
  await updateDoc(doc(db, "faucets", id), { status: newStatus, uptime: newUptime });
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
    uptime: parseInt(document.getElementById("editUptime").value) || 0,
    status: document.getElementById("editStatus").value
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

// Redirect paksa kalo belum login / bukan admin
onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== UID_ADMIN) { // <- PAKE VARIABEL + PETIK
    if(user) await signOut(auth); // kick kalo UID salah
    window.location.href = "login.html";
    return;
  }
  console.log("ADMIN LOGIN:", user.uid);
  await loadFaucets();
});


// URL Worker kamu. Ganti punya kamu
const WORKER_URL = "https://misty-truth-00e3.cnamelist.workers.dev/publish"; 

window.publishBtn = async function(){
  if(!requireAdmin()) return;
  
  if(!confirm("Yakin publish semua data faucet ke cards.json GitHub?")) return;
  
  showToast("Mengirim ke GitHub...");
  
  try{
    // Kirim semua data allFaucets ke Worker
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(allFaucets) // langsung kirim array nya
    });
    
    const result = await res.json();
    
    if(result.success){
      showToast("✅ Berhasil publish cards.json");
    } else {
      showToast("❌ Gagal: " + JSON.stringify(result.error));
      console.error(result.error);
    }
  } catch(err){
    showToast("❌ Error koneksi Worker");
    console.error(err);
  }
};

document.getElementById("shuffleBtn").addEventListener("click", shuffleTop3);

async function shuffleTop3() {
  if (cards.length < 3) return alert("Data kurang dari 3, gak bisa diacak");
  if (!confirm("Acak 3 Faucet teratas untuk Trending?")) return;

  // 1. Potong 3 data teratas
  const top3 = cards.slice(0, 3);

  // 2. Acak urutannya
  for (let i = top3.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top3[i], top3[j]] = [top3[j], top3[i]];
  }

  // 3. Tempel lagi ke posisi 0,1,2
  cards.splice(0, 3,...top3);

  // 4. Render ulang tabel biar langsung keliatan berubah
  render(); 

  alert("✅ Top 3 Trending sudah diacak. Sekarang klik Publish JSON biar masuk ke web");
}