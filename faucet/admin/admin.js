import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// GANTI INI 1 BARIS DOANG
// Ambil UID di: Firebase Console > Authentication > Users
// ======================================
const UID_ADMIN = "gZPXqeKPBAZfCzYXEcrGWMcSFHI2"; 
// ======================================

const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========== HALAMAN LOGIN index.html ==========
if (document.getElementById("loginForm")) {
  const err = document.getElementById("err");
  const form = document.getElementById("loginForm");

  onAuthStateChanged(auth, (user) => { 
    if (user?.uid === UID_ADMIN) location.href = "dashboard.html"; 
    else if (user) signOut(auth); // kick kalo bukan admin
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
        err.textContent = "Akses ditolak. UID kamu: " + cred.user.uid; // copy UID dari sini
        await signOut(auth); 
      }
    } catch (e) { 
      err.textContent = "Gagal: " + e.code.replace('auth/', '');
    }
  });
}

// ========== HALAMAN DASHBOARD dashboard.html ==========
if (document.getElementById("logoutBtn")) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return location.href = "index.html";
    if (user.uid !== UID_ADMIN) { 
      alert("Akses ditolak. UID kamu: " + user.uid); 
      await signOut(auth);
      return location.href = "index.html";
    }
    await setupLTC();
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
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
    }
  }
}