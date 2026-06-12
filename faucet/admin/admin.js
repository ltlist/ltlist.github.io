import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// ISI DATA FIREBASE DI SINI
// ======================================
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const UID_ADMIN = "";
// ======================================

// Cek config
const firebaseReady =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

if (!firebaseReady) {
  document.body.innerHTML = `
    <div style="
      max-width:600px;
      margin:50px auto;
      padding:20px;
      background:#111827;
      color:#fff;
      border-radius:10px;
      font-family:Arial,sans-serif;
    ">
      <h2>Firebase Belum Dikonfigurasi</h2>
      <p>Silakan isi:</p>
      <ul>
        <li>apiKey</li>
        <li>authDomain</li>
        <li>projectId</li>
        <li>storageBucket</li>
        <li>messagingSenderId</li>
        <li>appId</li>
        <li>UID_ADMIN</li>
      </ul>
    </div>
  `;
  throw new Error("Firebase config kosong");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================
// LOGIN PAGE
// ======================================
if (document.getElementById("btnLogin")) {

  const err = document.getElementById("err");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      location.href = "dashboard.html";
    }
  });

  document.getElementById("btnLogin").addEventListener("click", async () => {

    err.textContent = "";

    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value;

    if (!email || !pass) {
      err.textContent = "Email dan Password wajib diisi";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      location.href = "dashboard.html";
    } catch (e) {
      err.textContent = e.message;
    }
  });
}

// ======================================
// DASHBOARD PAGE
// ======================================
if (document.getElementById("logout")) {

  onAuthStateChanged(auth, async (user) => {

    console.log("User:", user);
    console.log("UID:", user?.uid);

    if (!user) {
      location.href = "index.html";
      return;
    }

    if (UID_ADMIN && user.uid !== UID_ADMIN) {
      alert("Bukan akun admin");
      location.href = "index.html";
      return;
    }

    await loadFaucets();
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
  });

  async function loadFaucets() {

    const list = document.getElementById("list");

    try {

      const snap = await getDocs(collection(db, "faucets"));

      list.innerHTML = "";

      snap.forEach((d) => {

        const data = d.data();

        list.innerHTML += `
          <tr>
            <td>${d.id}</td>
            <td>${data.name || "-"}</td>
            <td>
              <button
                class="danger"
                onclick="delFaucet('${d.id}')"
              >
                Hapus
              </button>
            </td>
          </tr>
        `;
      });

    } catch (err) {
      console.error(err);
      alert("Gagal memuat data Firestore");
    }
  }

  document.getElementById("add").addEventListener("click", async () => {

    const id = document.getElementById("id").value.trim().toUpperCase();
    const name = document.getElementById("name").value.trim();

    if (!id || !name) {
      alert("Isi ID dan Nama");
      return;
    }

    try {

      await setDoc(
        doc(db, "faucets", id),
        {
          name: name,
          updatedAt: Date.now()
        }
      );

      document.getElementById("id").value = "";
      document.getElementById("name").value = "";

      await loadFaucets();

      alert("Berhasil ditambahkan");

    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan");
    }
  });

  window.delFaucet = async (id) => {

    if (!confirm(`Hapus ${id}?`)) return;

    try {

      await deleteDoc(doc(db, "faucets", id));

      await loadFaucets();

    } catch (err) {
      console.error(err);
      alert("Gagal menghapus");
    }
  };
}