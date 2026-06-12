import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const UID_ADMIN = ""; // KOSONGIN DULU BUAT NGETES. Nanti isi UID kamu
// ======================================

const firebaseReady = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId;
if (!firebaseReady) {
  document.body.innerHTML = `<div style="max-width:600px;margin:50px auto;padding:20px;background:#111827;color:#fff;border-radius:10px;"><h2>Firebase Belum Dikonfigurasi</h2><p>Isi firebaseConfig di admin.js</p></div>`;
  throw new Error("Firebase config kosong");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========== LOGIN PAGE ==========
if (document.getElementById("btnLogin")) {
  const err = document.getElementById("err");
  const form = document.getElementById("loginForm"); // pake form biar gak reload

  onAuthStateChanged(auth, (user) => { if (user) location.href = "dashboard.html"; });

  form.addEventListener("submit", async (e) => { // <- GANTI JADI SUBMIT
    e.preventDefault();
    err.textContent = "";
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value;
    if (!email || !pass) return err.textContent = "Email dan Password wajib diisi";
    try { 
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) { 
      err.textContent = "Gagal: " + e.code; // biar jelas errornya auth/invalid-credential dll
    }
  });
}

// ========== DASHBOARD PAGE ==========
if (document.getElementById("logout")) {
  onAuthStateChanged(auth, async (user) => {
    console.log("UID Login:", user?.uid); // buat debug

    if (!user) return location.href = "index.html";

    if (UID_ADMIN && user.uid !== UID_ADMIN) { // cuma cek kalo UID_ADMIN diisi
      alert("Akun ini bukan Admin. UID kamu: " + user.uid);
      await signOut(auth);
      return location.href = "index.html";
    }

    await setupLTC(); // cuma setup 1 koin LTC
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
  });

  async function setupLTC() {
    const statusEl = document.getElementById("status");
    const list = document.getElementById("list");
    const ref = doc(db, "paycoin", "LTC"); // <-- KOLEKSI BENER

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { name: "LTC Faucet", updatedAt: Date.now() });
        statusEl.textContent = "LTC dibuat otomatis ✅";
      } else {
        statusEl.textContent = "Aktif ✅";
      }
      list.innerHTML = `<tr><td>LTC</td><td>LTC Faucet</td></tr>`; // gak ada tombol hapus
    } catch(e) {
      statusEl.textContent = "Error Firestore";
      console.error(e);
    }
  }
}