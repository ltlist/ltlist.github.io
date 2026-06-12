import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// 1. ISI DATA FIREBASE DI SINI
// ======================================
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

// 2. ISI UID KAMU DI SINI DOANG -> AMBIL DARI Firebase > Authentication > Users
const UID_ADMIN = "ISI_UID_KAMU_DISINI"; 
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
  const form = document.getElementById("loginForm");

  onAuthStateChanged(auth, (user) => { 
    if (user && user.uid === UID_ADMIN) { // cuma redirect kalo UID cocok
      location.href = "dashboard.html"; 
    } else if (user) { // kalo login tapi bukan UID kamu
      signOut(auth); // langsung kick
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value;
    if (!email || !pass) return err.textContent = "Email dan Password wajib diisi";
    
    try { 
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user.uid !== UID_ADMIN) {
        err.textContent = "Akses ditolak. Bukan akun admin.";
        await signOut(auth); // kick langsung
      }
    } catch (e) { 
      err.textContent = "Gagal: " + e.code.replace('auth/', '');
    }
  });
}

// ========== DASHBOARD PAGE ==========
if (document.getElementById("logout")) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return location.href = "index.html";

    if (user.uid !== UID_ADMIN) { // LAPISAN KE-2
      alert("Akses ditolak. UID kamu: " + user.uid); // biar kamu gampang copy
      await signOut(auth);
      return location.href = "index.html";
    }

    await setupLTC();
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await signOut(auth);
    location.href = "index.html";
  });

  async function setupLTC() {
    const statusEl = document.getElementById("status");
    const list = document.getElementById("list");
    const ref = doc(db, "paycoin", "LTC");

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { name: "LTC Faucet", updatedAt: Date.now() });
        statusEl.textContent = "LTC dibuat otomatis ✅";
      } else {
        statusEl.textContent = "Aktif ✅";
      }
      list.innerHTML = `<tr><td>LTC</td><td>LTC Faucet</td></tr>`;
    } catch(e) {
      statusEl.textContent = "Error: " + e.code; // permission-denied = rules salah
      statusEl.style.color = "#f87171";
      console.error(e);
    }
  }
}