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

let editRow = null;

// AUTO LOGIN
auth.onAuthStateChanged(user => {

if(user){

document.getElementById("loginBox").style.display = "none";
document.getElementById("dashboard").style.display = "block";

const info = document.getElementById("userInfo");

if(info){
  info.innerText = "Login sebagai: " + user.email;
}

if(document.getElementById("table")){
  load();
}

}else{

document.getElementById("loginBox").style.display = "block";
document.getElementById("dashboard").style.display = "none";

}

});

// LOGIN
window.login = async function(){

const email = document.getElementById("email").value.trim();
const pass = document.getElementById("pass").value;

try{

await auth.signInWithEmailAndPassword(email, pass);

document.getElementById("msg").innerText = "";

}catch(err){

document.getElementById("msg").innerText =
  err.message;

}

};

// LOGOUT
window.logout = async function(){

await auth.signOut();

};

// LOAD DATA
window.load = async function(){

try{

const res = await fetch(API);
const data = await res.json();

if(!document.getElementById("table")) return;

let html = `
<tr>
  <th>ID</th>
  <th>Name</th>
  <th>Coin</th>
  <th>Link</th>
  <th>Cooldown</th>
  <th>Action</th>
</tr>`;

data.forEach(d=>{

  html += `
  <tr>
    <td>${d.id}</td>
    <td>${d.name}</td>
    <td>${d.coin}</td>
    <td>${d.link}</td>
    <td>${d.cooldown}</td>
    <td>
      <button onclick='edit(${JSON.stringify(d)})'>
        Edit
      </button>

      <button onclick='hapus(${d.row})'>
        Delete
      </button>
    </td>
  </tr>`;

});

document.getElementById("table").innerHTML = html;

}catch(err){

console.log(err);

}

};

// ADD DATA
window.addData = async function(){

const form = new FormData();

form.append("action","add");
form.append("name",document.getElementById("name").value);
form.append("coin",document.getElementById("coin").value);
form.append("link",document.getElementById("link").value);
form.append("cooldown",document.getElementById("cooldown").value);

await fetch(API,{
method:"POST",
body:form
});

document.getElementById("name").value = "";
document.getElementById("link").value = "";
document.getElementById("cooldown").value = "";

load();

};

// DELETE
window.hapus = async function(row){

if(!confirm("Hapus data ini?")) return;

const form = new FormData();

form.append("action","delete");
form.append("row",row);

await fetch(API,{
method:"POST",
body:form
});

load();

};

// EDIT
window.edit = function(d){

editRow = d.row;

document.getElementById("editBox").style.display = "block";

document.getElementById("eid").value = d.id;
document.getElementById("ename").value = d.name;
document.getElementById("ecoin").value = d.coin;
document.getElementById("elink").value = d.link;
document.getElementById("ecooldown").value = d.cooldown;

};

// UPDATE
window.updateData = async function(){

const form = new FormData();

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

};