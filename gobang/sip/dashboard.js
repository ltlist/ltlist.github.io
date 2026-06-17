import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, writeBatch
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

let allFaucets = [];


// ===============================
// PUBLISH KE GITHUB CARDS.JSON
// ===============================
window.publishGithub = async function(){

  if(allFaucets.length === 0){
    showToast("Tidak ada data untuk dipublish");
    return;
  }

  const data = allFaucets.map(f=>({
    name:f.name,
    url:f.url,
    coin:f.coin,
    status:f.status,
    rank:f.rank
  }));

  console.log("Publish data:", data);

  try{

    const res = await fetch(`${API_URL}/publish`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(data)
    });


    const result = await res.json();

    console.log("Worker response:", result);


    if(result.success){

      showToast("JSON berhasil diupdate");

    }else{

      showToast("Gagal update JSON");

    }


  }catch(err){

    console.log("Publish error:",err);
    showToast("Publish gagal");

  }

}



// ===============================
// LOAD FIRESTORE
// ===============================
async function loadFaucets(){

  if(!requireAdmin()) return;


  const snap = await getDocs(
    collection(db,"faucets")
  );


  allFaucets = snap.docs.map(d=>({
    id:d.id,
    ...d.data()
  }));


  console.log("Firestore data:",allFaucets);



  await autoRerank();


  render(allFaucets);

}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const listDiv = document.getElementById("list");
const toastDiv = document.getElementById("toast");
const modalDiv = document.getElementById("editModal");

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
  const q = query(collection(db, "faucets"));
  const snap = await getDocs(q); // Gak pake orderBy dulu, biar bisa di sort ulang
  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  await autoRerank(); // 1. Auto beresin rank dulu
  await syncClicksFromKV(); // 2. Baru ambil clicks dari KV
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
          <span class="rank-badge">#${d.rank}</span> 
          <span class="status-badge ${d.status}">${d.status}</span>
        </div>
        <div class="card-mid">
          <div class="card-title" title="${d.name}">${d.name}</div>
          <div class="card-sub">${d.coin}</div>
          <div class="card-stats">${d.clicks ?? 0} claims</div>
        </div>
        <a href="${d.url}" target="_blank" rel="noopener" class="claim-btn" onclick="addClick('${d.id}')">Claim</a>
        <div class="card-right">
          <button class="btn-edit" onclick='openEdit(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button>
          <button class="btn-toggle" onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
          <button class="btn-delete" onclick="deleteFaucet('${d.id}')">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
}

window.addClick = async function(id){
  window.open(document.querySelector(`a[onclick*="${id}"]`).href, "_blank");
};

window.addFaucet = async function(){
  if(!requireAdmin()) return; 
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();
  if(!name || !url || !coin) return showToast("Isi Nama, URL, Coin dulu");

  await addDoc(collection(db, "faucets"), { 
    name, url, coin, status: "active", clicks: 0 // rank gak diisi manual lagi
  });
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  showToast(`Ditambah`);
  await loadFaucets(); // Auto rerank di dalam
};

window.deleteFaucet = async function(id){
  if(!requireAdmin()) return; 
  if(!confirm("Yakin hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  showToast("Faucet dihapus");
  await loadFaucets(); // Auto rerank di dalam
};

window.toggleStatus = async function(id, status){
  if(!requireAdmin()) return; 
  const newStatus = status === "active" ? "inactive" : "active";
  await updateDoc(doc(db, "faucets", id), { status: newStatus });
  showToast(`Status: ${newStatus}`);
  await loadFaucets(); // Auto rerank di dalam
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
  };
  await updateDoc(doc(db, "faucets", id), data);
  closeModal();
  showToast("Diupdate");
  await loadFaucets(); // Auto rerank di dalam
};

// === KUNCI: RERANK OTOMATIS PAKE BATCH ===
async function autoRerank(){
  if(allFaucets.length === 0) return;

  // 1. Sort dulu di memory. Aktif di atas, terus abcd
  allFaucets.sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.name.localeCompare(b.name); // Urut nama biar konsisten
  });

  // 2. Cek apa perlu update. Biar gak spam write ke Firestore
  const batch = writeBatch(db);
  let needUpdate = false;

  allFaucets.forEach((f, i) => {
    const newRank = i + 1;
    if (f.rank !== newRank) {
      needUpdate = true;
      const ref = doc(db, "faucets", f.id);
      batch.update(ref, { rank: newRank });
      f.rank = newRank; // Update di memory juga biar render langsung bener
    }
  });

  if (needUpdate) {
    await batch.commit(); // 1x write semua, hemat quota
    console.log("Rank auto dirapikan");
  }
}

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
  await loadFaucets();
});