import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* =====================
   FIREBASE
===================== */
apiKey: "AIzaSyAVokWJ_l3aITEhj6UPetF-MGQXKDV75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const listDiv = document.getElementById("list");

let allFaucets = [];
let editId = null;

/* =====================
   TOAST
===================== */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;

  t.innerText = msg;

  t.style.background =
    type === "error" ? "#dc2626" :
    type === "warning" ? "#f59e0b" :
    "#0f766e";

  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {
  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  render(allFaucets);
}

/* =====================
   AUTO RE-RANK (STABLE)
===================== */
async function autoReRank() {

  const active = allFaucets
    .filter(f => f.status === "active")
    .sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  const batch = writeBatch(db);

  active.forEach((f, i) => {
    batch.update(doc(db, "faucets", f.id), {
      rank: i + 1
    });
  });

  await batch.commit();
}

/* =====================
   CHECK URL (SAFE VERSION)
===================== */
async function checkUrlAlive(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal
    });

    clearTimeout(timeout);
    return true;

  } catch (e) {
    return false;
  }
}

/* =====================
   RENDER
===================== */
function render(data) {

  listDiv.innerHTML = data.map(d => {
    const status = d.status || "inactive";

    return `
      <div class="card">

        <div class="rank-badge">#${d.rank || "-"}</div>

        <b>${d.name}</b> (${d.coin})

        <span style="
          float:right;
          background:${status === "active" ? "#00ff88" : "#ff4d4d"};
          color:#000;
          padding:3px 8px;
          border-radius:6px;
          font-size:12px;
        ">
          ${status}
        </span>

        <br><br>

        <a href="${d.url}" target="_blank">Visit</a>

        <br><br>

        <button onclick="openEdit('${d.id}')">Edit</button>
        <button onclick="toggleStatus('${d.id}','${status}')">Toggle</button>
        <button onclick="deleteFaucet('${d.id}')">Delete</button>

      </div>
    `;
  }).join("");
}

/* =====================
   ADD FAUCET (FIXED)
===================== */
window.addFaucet = async function () {

  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const coin = document.getElementById("coin").value.trim();
  const rank = Number(document.getElementById("rank").value);

  if (!name || !url || !coin) {
    showToast("Lengkapi data!", "warning");
    return;
  }

  await addDoc(collection(db, "faucets"), {
    name,
    url,
    coin,
    rank,
    status: "active",

    clicks: 0,
    likes: 0,
    dislikes: 0,

    uptime: 1,
    createdAt: new Date()
  });

  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  document.getElementById("rank").value = "";

  await autoReRank();
  await loadFaucets();

  showToast("Faucet ditambahkan!");
};

/* =====================
   SAVE EDIT
===================== */
window.saveEdit = async function () {

  await updateDoc(doc(db, "faucets", editId), {
    name: document.getElementById("editName").value,
    url: document.getElementById("editUrl").value,
    coin: document.getElementById("editCoin").value,
    rank: Number(document.getElementById("editRank").value),
    status: document.getElementById("editStatus").value
  });

  await autoReRank();
  await loadFaucets();

  closeModal();
  showToast("Data diupdate!");
};

/* =====================
   DELETE
===================== */
window.deleteFaucet = async function (id) {

  await deleteDoc(doc(db, "faucets", id));

  await autoReRank();
  await loadFaucets();

  showToast("Faucet dihapus", "error");
};

/* =====================
   TOGGLE STATUS
===================== */
window.toggleStatus = async function (id, status) {

  const newStatus = status === "active" ? "inactive" : "active";

  await updateDoc(doc(db, "faucets", id), {
    status: newStatus
  });

  await autoReRank();
  await loadFaucets();

  showToast("Status: " + newStatus);
};

/* =====================
   SCAN DEAD FAUCET PRO (FIXED + CLEAN)
===================== */
window.scanDeadFaucets = async function () {

  let deadCount = 0;

  showToast("Scanning faucets...", "warning");

  for (let f of allFaucets) {

    if (f.status !== "active") continue;

    let alive = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(f.url, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal
      });

      clearTimeout(timeout);

    } catch (e) {
      alive = false;
    }

    if (!alive) {
      await updateDoc(doc(db, "faucets", f.id), {
        status: "inactive",
        rank: 9999,
        uptime: 0
      });

      deadCount++;
    }
  }

  await autoReRank();
  await loadFaucets();

  showToast("Scan selesai. Dead: " + deadCount);
};

/* =====================
   LOGOUT
===================== */
window.logout = async function () {
  await signOut(auth);
  location.href = "login.html";
};

/* =====================
   INIT
===================== */
loadFaucets();