import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== GANTI BAGIAN INI =====
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};
const WORKER_URL = "https://NAMA-WORKER-KAMU.workers.dev"; // Isi nanti abis bikin Worker
// ============================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const select = document.getElementById('faucetSelect');
const btn = document.getElementById('btnClaim');
const msg = document.getElementById('msg');
const totalEl = document.getElementById('totalClaims');
const addressEl = document.getElementById('address');

// 1. Load list faucet dari Firestore /faucets
async function loadFaucets(){
  try{
    const snap = await getDocs(collection(db, "faucets"));
    select.innerHTML = "";
    snap.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id; // id doc = currency misal "LTC"
      opt.textContent = d.data().name; // field name
      select.appendChild(opt);
    });
  }catch(e){
    msg.textContent = "Gagal load faucet. Cek Firebase Rules.";
    console.error(e);
  }
}
loadFaucets();

// 2. Load total claim dari Worker KV
fetch(WORKER_URL + "/api/stats")
  .then(r=>r.json())
  .then(d=> totalEl.textContent = d.total || 0)
  .catch(()=> totalEl.textContent = "?");

// 3. Claim
btn.onclick = async () => {
  const currency = select.value;
  const address = addressEl.value.trim();
  if(!address) return msg.textContent = "Isi alamat FaucetPay dulu!";

  btn.disabled = true;
  msg.textContent = "Proses claim...";
  
  try{
    const res = await fetch(WORKER_URL + "/api/claim", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({currency, address})
    });
    const data = await res.json();
    msg.textContent = data.message;
    if(res.ok){
      addressEl.value = "";
      totalEl.textContent = Number(totalEl.textContent)+1;
    }
  }catch(e){
    msg.textContent = "Worker belum aktif.";
  }
  btn.disabled = false;
}