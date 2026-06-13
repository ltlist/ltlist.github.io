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
  apiKey: "AIzaSyAVokJ_Wj3aITEhj6UPetF-KDV75S8",
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

// 🔥 FIX PENTING: session login tahan refresh
setPersistence(auth, browserLocalPersistence).catch(console.error);

const listDiv = document.getElementById("list");
const toastDiv = document.getElementById("toast");

let allFaucets = [];

const showToast = (msg) => {
  toastDiv.textContent = msg;
  toastDiv.classList.add("show");
  setTimeout(() => toastDiv.classList.remove("show"), 2000);
};

function requireAdmin() {
  const user = auth.currentUser;
  return user && user.uid === UID_ADMIN;
}

// =========================
// LOAD DATA
// =========================
async function loadFaucets() {
  if (!requireAdmin()) return;

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
// AUTH (FIX UTAMA)
// =========================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (user.uid !== UID_ADMIN) {
    signOut(auth);
    window.location.replace("login.html");
    return;
  }

  loadFaucets();
});