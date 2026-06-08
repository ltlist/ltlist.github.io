<script>

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_l3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const API = "https://script.google.com/macros/s/AKfycbw8NvblgJJ6EOvjWRgHkizjWCGid0BjxTrhrgkw7C7R2QHIkF6DgoVkOxo42Hv4kGQ8/exec";

// AUTO LOGIN
auth.onAuthStateChanged(user => {

  if(user){

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    document.getElementById("userInfo").innerText =
      "Login sebagai: " + user.email;

    loadData();

  }else{

    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashboard").style.display = "none";

  }

});

// LOGIN
async function login(){

  const email = document.getElementById("email").value;
  const pass = document.getElementById("pass").value;

  try{

    await auth.signInWithEmailAndPassword(email, pass);

    document.getElementById("msg").innerText =
      "Login berhasil";

  }catch(err){

    document.getElementById("msg").innerText =
      err.message;

  }

}

// LOGOUT
async function logout(){

  await auth.signOut();

}

// CEK LOGIN
function checkLogin(){

  if(!auth.currentUser){

    alert("Silakan login");

    return false;

  }

  return true;

}

// LOAD DATA
async function loadData(){

  try{

    const res = await fetch(API);
    const data = await res.json();

    let html = `
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Coin</th>
      <th>Link</th>
      <th>Cooldown</th>
    </tr>`;

    data.forEach(item=>{

      html += `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.coin}</td>
        <td>
          <a href="${item.link}" target="_blank">
            Open
          </a>
        </td>
        <td>${item.cooldown}</td>
      </tr>`;

    });

    document.getElementById("table").innerHTML = html;

  }catch(err){

    console.log(err);

  }

}

// ADD DATA
async function addData(){

  if(!checkLogin()) return;

  const form = new FormData();

  form.append("action","add");
  form.append("name",document.getElementById("name").value);
  form.append("coin",document.getElementById("coin").value);
  form.append("link",document.getElementById("link").value);
  form.append("cooldown",document.getElementById("cooldown").value);

  try{

    await fetch(API,{
      method:"POST",
      body:form
    });

    alert("Data berhasil ditambah");

    document.getElementById("name").value = "";
    document.getElementById("link").value = "";
    document.getElementById("cooldown").value = "";

    loadData();

  }catch(err){

    alert(err.message);

  }

}

</script>