import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3iATEhj6UPetF-Fix",
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
    showToast("Akses ditolak");
    return false;
  }
  return true;
}

/* =========================
   LOAD FIRESTORE
========================= */
async function loadFaucets() {
  if (!requireAdmin()) return;

  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);

  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // ❗ clicks DIAMBIL DARI CLOUDFARE KV
  await syncClicks();

  render(allFaucets);
}

/* =========================
   SYNC CLICK FROM WORKER KV
========================= */
async function syncClicks() {
  try {
    const res = await fetch(`${API_URL}/api/get-clicks`);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    data.forEach(item => {
      const f = allFaucets.find(x => x.id === item.id);
      if (f) f.clicks = item.clicks;
    });

  } catch (e) {
    console.log("sync error:", e);
  }
}

/* =========================
   RENDER
========================= */
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

        <!-- ❗ clicks dari Cloudflare -->
        <div class="card-stats">${d.clicks || 0} claims</div>
      </div>

      <a href="${d.url}" target="_blank" class="claim-btn">
        Open
      </a>

      <div class="card-right">
        <button onclick='openEdit(${JSON.stringify(d).replace(/'/g,"&apos;")})'>Edit</button>
        <button onclick="toggleStatus('${d.id}','${d.status}')">Toggle</button>
        <button onclick="deleteFaucet('${d.id}')">Hapus</button>
      </div>
    </div>
  `).join("");
}

/* =========================
   ADD FAUCET
========================= */
window.addFaucet = async function () {
  if (!requireAdmin()) return;

  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim().toUpperCase();

  const snap = await getDocs(collection(db, "faucets"));
  const nextRank = snap.size + 1;

  await addDoc(collection(db, "faucets"), {
    name,
    url,
    coin,
    status: "active",
    rank: nextRank
  });

  showToast("Ditambahkan");
  loadFaucets();
};

/* =========================
   DELETE
========================= */
window.deleteFaucet = async function (id) {
  if (!requireAdmin()) return;

  await deleteDoc(doc(db, "faucets", id));
  showToast("Dihapus");
  loadFaucets();
};

/* =========================
   TOGGLE STATUS
========================= */
window.toggleStatus = async function (id, status) {
  if (!requireAdmin()) return;

  const newStatus = status === "active" ? "inactive" : "active";

  await updateDoc(doc(db, "faucets", id), {
    status: newStatus
  });

  showToast("Status update");
  loadFaucets();
};

/* =========================
   EDIT SAVE
========================= */
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

/* =========================
   AUTH
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== UID_ADMIN) {
    if (user) await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  await loadFaucets();
});