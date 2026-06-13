import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokJ_Wj3aITEhj6UPetF-Fix",
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

// 🔥 FIX 1: LOGIN TIDAK HILANG SAAT REFRESH
setPersistence(auth, browserLocalPersistence);

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

  if (!user) return false;

  if (user.uid !== UID_ADMIN) {
    showToast("Akses ditolak");
    return false;
  }

  return true;
}

// =========================
// LOAD DATA
// =========================
async function loadFaucets() {
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);

  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  render(allFaucets);
}

// =========================
// RENDER
// =========================
function render(data) {
  listDiv.innerHTML = data.map(d => `
    <div class="card">
      <div class="card-left">
        <span class="rank-badge">#${d.rank ?? '-'}</span>
        <span class="status-badge ${d.status}">${d.status}</span>
      </div>

      <div class="card-mid">
        <div class="card-title">${d.name}</div>
        <div class="card-sub">${d.coin}</div>
        <div class="card-stats">${d.clicks || 0} claims</div>
      </div>

      <a href="${d.url}" target="_blank" class="claim-btn">Open</a>
    </div>
  `).join("");
}

// =========================
// ADD
// =========================
window.addFaucet = async function () {
  if (!requireAdmin()) return;

  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();

  const snap = await getDocs(collection(db, "faucets"));
  const nextRank = snap.size + 1;

  await addDoc(collection(db, "faucets"), {
    name, url, coin,
    status: "active",
    rank: nextRank,
    clicks: 0
  });

  showToast("Ditambahkan");
  loadFaucets();
};

// =========================
// DELETE
// =========================
window.deleteFaucet = async function (id) {
  if (!requireAdmin()) return;

  await deleteDoc(doc(db, "faucets", id));

  showToast("Dihapus");
  loadFaucets();
};

// =========================
// TOGGLE
// =========================
window.toggleStatus = async function (id, status) {
  if (!requireAdmin()) return;

  const newStatus = status === "active" ? "inactive" : "active";

  await updateDoc(doc(db, "faucets", id), { status: newStatus });

  showToast("Status diupdate");
  loadFaucets();
};

// =========================
// EDIT SAVE
// =========================
window.saveEdit = async function () {
  if (!requireAdmin()) return;

  const id = document.getElementById("editId").value;

  await updateDoc(doc(db, "faucets", id), {
    name: document.getElementById("editName").value,
    url: document.getElementById("editUrl").value,
    coin: document.getElementById("editCoin").value
  });

  showToast("Updated");
  loadFaucets();
};

// =========================
// AUTH FIX (ANTI LOGOUT LOOP)
// =========================
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// WAJIB
setPersistence(auth, browserLocalPersistence).catch(console.error);

let authReady = false;

onAuthStateChanged(auth, (user) => {
  authReady = true;

  if (!user) {
    if (authReady) {
      window.location.replace("login.html");
    }
    return;
  }

  if (user.uid !== UID_ADMIN) {
    signOut(auth);
    window.location.replace("login.html");
    return;
  }

  loadFaucets();
});