const API = "https://script.google.com/macros/s/AKfycbyi-AhsKNTbctSLL-gAok78XZEN7M1t2OS3X0-ufNUpzmyyOi2CyABvRFdEnEf4oSck/exec";
const PASSWORD = "ltlis123";

// LOAD
async function load(){
const res = await fetch(API + "?action=list");
const data = await res.json();

let html = "";

data.forEach(d=>{
html += `
<tr>
<td>${d.id}</td>
<td>${d.name}</td>
<td>${d.coin}</td>
<td>${d.link}</td>
<td>${d.cooldown}</td>
</tr>
`;
});

document.getElementById("table").innerHTML = html;
}
load();

// ADD
function addData(){
const id = document.getElementById("id").value;
const name = document.getElementById("name").value;
const coin = document.getElementById("coin").value;
const link = document.getElementById("link").value;
const cooldown = document.getElementById("cooldown").value;

fetch(`${API}?action=add&id=${id}&name=${encodeURIComponent(name)}&coin=${coin}&link=${encodeURIComponent(link)}&cooldown=${cooldown}&password=${PASSWORD}`)
.then(r=>r.json())
.then(r=>{
alert(r.message);
load();
});
}

// EDIT
function updateData(){
const id = document.getElementById("id").value;
const name = document.getElementById("name").value;
const coin = document.getElementById("coin").value;
const link = document.getElementById("link").value;
const cooldown = document.getElementById("cooldown").value;

fetch(`${API}?action=edit&id=${id}&name=${encodeURIComponent(name)}&coin=${coin}&link=${encodeURIComponent(link)}&cooldown=${cooldown}&password=${PASSWORD}`)
.then(r=>r.json())
.then(r=>{
alert(r.message);
load();
});
}

// DELETE
function deleteData(){
const id = document.getElementById("id").value;

fetch(`${API}?action=delete&id=${id}&password=${PASSWORD}`)
.then(r=>r.json())
.then(r=>{
alert(r.message);
load();
});
}