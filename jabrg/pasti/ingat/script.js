// FIREBASE CONFIG
const firebaseConfig = {
apiKey: "API_KEY_KAMU",
authDomain: "PROJECT.firebaseapp.com",
projectId: "PROJECT_ID",
storageBucket: "PROJECT.appspot.com",
messagingSenderId: "XXXXXXXX",
appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const API = "https://script.google.com/macros/s/AKfycbw8NvblgJJ6EOvjWRgHkizjWCGid0BjxTrhrgkw7C7R2QHIkF6DgoVkOxo42Hv4kGQ8/exec";

let editRow = null;

// AUTO LOGIN
auth.onAuthStateChanged(user => {

if(user){

document.getElementById("loginBox").style.display = "none";
document.getElementById("dashboard").style.display = "block";

load();

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

}catch(err){

document.getElementById("msg").innerText = err.message;

}

}

// LOGOUT
async function logout(){

await auth.signOut();

}

// LOAD DATA
async function load(){

let res = await fetch(API);
let data = await res.json();

let html = `

  <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Coin</th>
    <th>Link</th>
    <th>Cooldown</th>
    <th>Action</th>
  </tr>`;data.forEach(d=>{

html += `
<tr>
  <td>${d.id}</td>
  <td>${d.name}</td>
  <td>${d.coin}</td>
  <td>${d.link}</td>
  <td>${d.cooldown}</td>
  <td>
    <button onclick='edit(${JSON.stringify(d)})'>Edit</button>
    <button onclick='hapus(${d.row})'>Delete</button>
  </td>
</tr>`;

});

document.getElementById("table").innerHTML = html;
}

// ADD
async function addData(){

let form = new FormData();

form.append("action","add");
form.append("name",document.getElementById("name").value);
form.append("coin",document.getElementById("coin").value);
form.append("link",document.getElementById("link").value);
form.append("cooldown",document.getElementById("cooldown").value);

await fetch(API,{
method:"POST",
body:form
});

load();
}

// DELETE
async function hapus(row){

let form = new FormData();

form.append("action","delete");
form.append("row",row);

await fetch(API,{
method:"POST",
body:form
});

load();
}

// EDIT
function edit(d){

editRow = d.row;

document.getElementById("editBox").style.display = "block";

document.getElementById("eid").value = d.id;
document.getElementById("ename").value = d.name;
document.getElementById("ecoin").value = d.coin;
document.getElementById("elink").value = d.link;
document.getElementById("ecooldown").value = d.cooldown;
}

// UPDATE
async function updateData(){

let form = new FormData();

form.append("action","update");
form.append("row",editRow);
form.append("id",document.getElementById("eid").value);
form.append("name",document.getElementById("ename").value);
form.append("coin",document.getElementById("ecoin").value);
form.append("link",document.getElementById("elink").value);
form.append("cooldown",document.getElementById("ecooldown").value);

await fetch(API,{
method:"POST",
body:form
});

document.getElementById("editBox").style.display = "none";

load();
}