/* =========================
   FIREBASE IMPORT
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


/* =========================
   FIREBASE CONFIG
========================= */
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


/* =========================
   DOM ELEMENTS
========================= */
const listDiv = document.getElementById("list");
const toastDiv = document.getElementById("toast");
const modalDiv = document.getElementById("editModal");


/* =========================
   GLOBAL VARIABLES
========================= */
let allFaucets = [];


/* =========================
   UTILITIES
========================= */
const showToast = (msg) => {
  toastDiv.textContent = msg;
  toastDiv.classList.add("show");

  setTimeout(() => {
    toastDiv.classList.remove("show");
  }, 2000);
};

function requireAuth() {
  if (!auth.currentUser) {
    showToast("Login dulu admin");
    return false;
  }
  return true;
}


/* =========================
   LOAD DATA
========================= */
async function loadFaucets() {
  const q = query(
    collection(db, "faucets"),
    orderBy("rank", "asc")
  );

  const snap = await getDocs(q);

  allFaucets = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  render(allFaucets);
}


/* =========================
   RENDER
========================= */
function render(data) {

  if (data.length === 0) {
    listDiv.innerHTML =
      "<p style='text-align:center;color:var(--muted);padding:20px;'>Belum ada data faucet.</p>";
    return;
  }

  listDiv.innerHTML = data.map(d => {

    const uptimeColor =
      d.uptime >= 90
        ? "var(--green)"
        : d.uptime >= 50
        ? "var(--yellow)"
        : "var(--red)";

    return `
      ...
    `;

  }).join("");
}


/* =========================
   CLICK COUNTER
========================= */
window.addClick = async function(id) {
  await updateDoc(
    doc(db, "faucets", id),
    {
      clicks: increment(1)
    }
  );
};


/* =========================
   ADD FAUCET
========================= */
window.addFaucet = async function() {

  if (!requireAuth()) return;

  const name =
    document.getElementById("name").value.trim();

  const url =
    document.getElementById("url").value.trim();

  const coin =
    document.getElementById("coin").value
      .trim()
      .toUpperCase();

  if (!name || !url || !coin) {
    return showToast("Isi Nama, URL, Coin dulu");
  }

  const snap = await getDocs(
    collection(db, "faucets")
  );

  const nextRank = snap.size + 1;

  await addDoc(
    collection(db, "faucets"),
    {
      name,
      url,
      coin,
      status: "active",
      rank: nextRank,
      uptime: 100,
      clicks: 0
    }
  );

  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("coin").value = "";

  showToast(`Ditambah. Rank: #${nextRank}`);

  loadFaucets();
};


/* =========================
   DELETE FAUCET
========================= */
window.deleteFaucet = async function(id) {

  if (!requireAuth()) return;

  if (!confirm("Yakin hapus?")) return;

  await deleteDoc(
    doc(db, "faucets", id)
  );

  showToast("Faucet dihapus. Merapikan rank...");

  await rerank(true);
};


/* =========================
   STATUS
========================= */
window.toggleStatus = async function(id, status) {

  if (!requireAuth()) return;

  const newStatus =
    status === "active"
      ? "inactive"
      : "active";

  const newUptime =
    newStatus === "active"
      ? 100
      : 0;

  await updateDoc(
    doc(db, "faucets", id),
    {
      status: newStatus,
      uptime: newUptime
    }
  );

  showToast(`Status: ${newStatus}`);

  loadFaucets();
};


/* =========================
   EDIT MODAL
========================= */
window.openEdit = function(data) {

  if (!requireAuth()) return;

  document.getElementById("editId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editUrl").value = data.url;
  document.getElementById("editCoin").value = data.coin;
  document.getElementById("editUptime").value = data.uptime;
  document.getElementById("editStatus").value = data.status;

  modalDiv.classList.add("show");
};

window.closeModal = function() {
  modalDiv.classList.remove("show");
};

window.saveEdit = async function() {

  if (!requireAuth()) return;

  const id =
    document.getElementById("editId").value;

  const data = {
    name:
      document.getElementById("editName")
        .value.trim(),

    url:
      document.getElementById("editUrl")
        .value.trim(),

    coin:
      document.getElementById("editCoin")
        .value.trim()
        .toUpperCase(),

    uptime:
      parseInt(
        document.getElementById("editUptime").value
      ) || 0,

    status:
      document.getElementById("editStatus").value
  };

  await updateDoc(
    doc(db, "faucets", id),
    data
  );

  closeModal();

  showToast("Diupdate");

  loadFaucets();
};


/* =========================
   RERANK
========================= */
window.rerank = async function(auto = false) {

  if (!requireAuth()) return;

  if (!auto) {
    if (!confirm("Urutkan ulang rank 1,2,3...?")) {
      return;
    }
  }

  const snap = await getDocs(
    query(
      collection(db, "faucets"),
      orderBy("rank", "asc")
    )
  );

  if (snap.empty) {
    return loadFaucets();
  }

  let i = 1;

  const updates = snap.docs.map(d =>
    updateDoc(
      doc(db, "faucets", d.id),
      { rank: i++ }
    )
  );

  await Promise.all(updates);

  showToast(
    auto
      ? "Rank auto dirapikan"
      : "Rank sudah diurutkan ulang"
  );

  loadFaucets();
};


/* =========================
   SEARCH
========================= */
window.searchFaucet = function() {

  const v =
    document.getElementById("search")
      .value
      .toLowerCase();

  const filtered = allFaucets.filter(f =>
    f.name.toLowerCase().includes(v) ||
    f.coin.toLowerCase().includes(v) ||
    String(f.rank).includes(v)
  );

  render(filtered);
};


/* =========================
   LOGOUT
========================= */
window.logout = () =>
  signOut(auth)
    .then(() => {
      window.location.href = "login.html";
    });


/* =========================
   EVENTS
========================= */
modalDiv.onclick = (e) => {
  if (e.target === modalDiv) {
    closeModal();
  }
};

window.addEventListener("scroll", () => {
  document
    .querySelector(".navbar")
    .classList.toggle(
      "scrolled",
      window.scrollY > 10
    );
});


/* =========================
   AUTH GUARD
========================= */
onAuthStateChanged(auth, async (user) => {

  console.log("AUTH:", user);

  if (user) {

    console.log("UID:", user.uid);

    await loadFaucets();

  } else {

    console.log("BELUM LOGIN");

    window.location.href = "login.html";

  }

});