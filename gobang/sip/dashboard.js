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
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
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
    type === "error"
      ? "#dc2626"
      : type === "warning"
      ? "#f59e0b"
      : "#0f766e";

  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
}

/* =====================
   CHECK URL ALIVE
===================== */
async function checkUrlAlive(url) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

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
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    allFaucets.push({ id: d.id, ...d.data() });
  });

  // rank sorting (inactive otomatis turun)
  allFaucets.sort((a, b) =>
    (a.rank || 9999) - (b.rank || 9999)
  );

  render(allFaucets);
}

/* =====================
   AUTO RE-RANK
===================== */
async function autoReRank(){

  const activeFaucets = allFaucets
    .filter(f => f.status === "active")
    .sort(
      (a,b) =>
      (a.rank || 9999) -
      (b.rank || 9999)
    );

  const batch = writeBatch(db);

  activeFaucets.forEach((f,index)=>{

    batch.update(
      doc(db,"faucets",f.id),
      {
        rank:index + 1
      }
    );

  });

  await batch.commit();
}

/* =====================
   RENDER
===================== */
function render(data) {

  let html = "";

  data.forEach((d) => {

    const status = d.status || "inactive";

    html += `
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
  });

  listDiv.innerHTML = html;
}

/* =====================
   ADD FAUCET
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

  // ANTI DUPLICATE NAME
  const sameName = allFaucets.find(
    f => (f.name || "").toLowerCase() === name.toLowerCase()
  );

  if (sameName) {
    showToast("Nama faucet sudah ada!", "error");
    return;
  }

  // ANTI DUPLICATE URL
  const sameUrl = allFaucets.find(
    f => (f.url || "").toLowerCase() === url.toLowerCase()
  );

  if (sameUrl) {
    showToast("URL faucet sudah ada!", "error");
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
    uptime: 100,
    createdAt: new Date()
  });

  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";
  document.getElementById("rank").value = "";

  showToast("Faucet ditambahkan!");

  loadFaucets();
};

/* =====================
   OPEN EDIT
===================== */
window.openEdit = function (id) {

  const f = allFaucets.find(x => x.id === id);
  if (!f) return;

  editId = id;

  document.getElementById("editName").value = f.name;
  document.getElementById("editUrl").value = f.url;
  document.getElementById("editCoin").value = f.coin;
  document.getElementById("editRank").value = f.rank;
  document.getElementById("editStatus").value = f.status;

  document.getElementById("editModal").style.display = "flex";
};

/* =====================
   CLOSE MODAL
===================== */
window.closeModal = function () {
  document.getElementById("editModal").style.display = "none";
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

  showToast("Data diupdate!");
  closeModal();
  loadFaucets();
};

/* =====================
   DELETE
===================== */
window.deleteFaucet = async function (id) {

  await deleteDoc(doc(db, "faucets", id));

await loadFaucets();
await autoReRank();
await loadFaucets();

  showToast("Faucet dihapus", "error");
  loadFaucets();
};

/* =====================
   TOGGLE STATUS
===================== */
window.toggleStatus = async function (id, status) {

  const newStatus = status === "active" ? "inactive" : "active";

  await updateDoc(doc(db, "faucets", id), {
    status: newStatus
  });

  showToast("Status: " + newStatus);
  loadFaucets();
};

/* =====================
   SEARCH
===================== */
window.searchFaucet = function () {

  const q = document.getElementById("search").value.toLowerCase();

  const filtered = allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  );

  render(filtered);
};

/* =====================
   AUTO SCAN DEAD FAUCETS
===================== */
window.scanDeadFaucets = async function () {

  let deadCount = 0;

  for (let f of allFaucets) {

    if (f.status !== "active") continue;

    const alive = await checkUrlAlive(f.url);

    if (!alive) {

      await updateDoc(doc(db, "faucets", f.id), {
        status: "inactive",
        rank: 9999
      });

      deadCount++;

      showToast("Dead: " + f.name, "error");
    }
  }

  showToast("Scan selesai. Dead: " + deadCount);

  loadFaucets();
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