import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVf...",
  authDomain: "ltlist-firebaseapp.com",
  projectId: "ltlist",
  storageBucket: "ltlist.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const API_URL = "https://api.ltlist.workers.dev"; // GANTI URL WORKER KAMU

const listEl = document.getElementById("list");
const form = document.getElementById("form");

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "login.html";
  loadData();
});

async function loadData() {
  listEl.innerHTML = "Loading...";

  // 1. Ambil semua faucet dari Firestore, urut by rank
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);
  const faucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Ambil semua count dari Worker sekaligus
  const ids = faucets.map(f => f.id);
  const res = await fetch(`${API_URL}/counts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });
  const counts = await res.json(); // { id1: 12, id2: 5, ... }

  // 3. Render
  listEl.innerHTML = "";
  faucets.forEach((f, i) => {
    const count = counts[f.id] ?? 0; // ambil dari KV, bukan firestore.clicks

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="rank">#${f.rank}</div> <!-- RANK TETEP ADA -->
      <div class="info">
        <b>${f.name}</b>
        <span>${count} claims</span> <!-- INI DARI WORKER -->
      </div>
      <div class="actions">
        <button onclick="editFaucet('${f.id}')">Edit</button>
        <button onclick="deleteFaucet('${f.id}', ${f.rank})" class="danger">Hapus</button>
      </div>
    `;
    listEl.appendChild(card);
  });
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = form.name.value;
  const url = form.url.value;

  // Cari rank paling akhir + 1
  const snap = await getDocs(query(collection(db, "faucets"), orderBy("rank", "desc"), limit(1)));
  const nextRank = snap.empty ? 1 : snap.docs[0].data().rank + 1;

  await addDoc(collection(db, "faucets"), {
    name, url, rank: nextRank // cuma simpan rank, ga ada clicks
  });
  form.reset();
  loadData();
});

window.deleteFaucet = async (id, rank) => {
  if (!confirm("Hapus?")) return;
  await deleteDoc(doc(db, "faucets", id));
  // Geser rank yang dibawahnya naik 1
  const snap = await getDocs(query(collection(db, "faucets"), where("rank", ">", rank)));
  const batch = [];
  snap.forEach(d => batch.push(updateDoc(d.ref, { rank: d.data().rank - 1 })));
  await Promise.all(batch);
  loadData();
};

window.editFaucet = async (id) => {
  const newRank = prompt("Rank baru:");
  if (!newRank) return;
  await updateDoc(doc(db, "faucets", id), { rank: Number(newRank) });
  loadData();
};

document.getElementById("logout").onclick = () => signOut(auth);