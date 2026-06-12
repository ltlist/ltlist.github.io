import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== GANTI BAGIAN INI =====
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_KAMU",
  authDomain: "GANTI_DENGAN_AUTH_DOMAIN", 
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI",
  messagingSenderId: "GANTI",
  appId: "GANTI"
};
const UID_ADMIN = "GANTI_DENGAN_UID_KAMU"; // Ambil di Firebase > Authentication > Users
// ============================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========== LOGIC index.html = LOGIN ==========
if(document.getElementById('btnLogin')){
  const err = document.getElementById('err');
  onAuthStateChanged(auth, u => { if(u) location.href="dashboard.html"; }); // ke dashboard
  
  document.getElementById('btnLogin').onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    signInWithEmailAndPassword(auth, email, pass).catch(e=> err.textContent=e.message);
  }
}

// ========== LOGIC dashboard.html ==========
if(document.getElementById('logout')){
  onAuthStateChanged(auth, u => { 
    if(!u || u.uid !== UID_ADMIN) location.href="index.html"; // balik ke login
    else loadFaucets(); 
  });

  document.getElementById('logout').onclick = () => signOut(auth);

  async function loadFaucets(){
    const snap = await getDocs(collection(db,"faucets"));
    const list = document.getElementById('list');
    list.innerHTML = "";
    snap.forEach(d=>{
      list.innerHTML += `<tr><td>${d.id}</td><td>${d.data().name}</td><td><button class="danger" onclick="delFaucet('${d.id}')">Hapus</button></td></tr>`;
    });
  }

  document.getElementById('add').onclick = async () => {
    const id = document.getElementById('id').value.trim();
    const name = document.getElementById('name').value.trim();
    if(!id || !name) return alert("Isi ID dan Nama");
    await setDoc(doc(db,"faucets",id), {name:name}); // pake setDoc biar ID nya sesuai input
    document.getElementById('id').value = "";
    document.getElementById('name').value = "";
    loadFaucets();
  }
  
  window.delFaucet = async (id) => {
    if(confirm("Hapus "+id+"?")){
      await deleteDoc(doc(db,"faucets",id));
      loadFaucets();
    }
  }
}