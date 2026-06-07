const API = "https://script.google.com/macros/s/AKfycbyi-AhsKNTbctSLL-gAok78XZEN7M1t2OS3X0-ufNUpzmyyOi2CyABvRFdEnEf4oSck/exec";
const PASSWORD = "ltlis123";

// ================= LOAD =================
async function load(){

const res = await fetch(API + "?action=list");
const data = await res.json();

let html = "";

data.forEach(d => {
html += `
<tr>
<td>${d.id}</td>
<td>${d.name}</td>
<td>${d.coin}</td>
<td><a href="${d.link}" target="_blank">open</a></td>
<td>${d.cooldown}</td>
</tr>
`;
});

document.getElementById("table").innerHTML = html;
}

load();

// ================= ADD =================
function addData(){

const id = idVal();
const name = val("name");
const coin = val("coin");
const link = val("link");
const cooldown = val("cooldown");

fetch(`${API}?action=add&password=${PASSWORD}&id=${id}&name=${encodeURIComponent(name)}&coin=${coin}&link=${encodeURIComponent(link)}&cooldown=${cooldown}`)
.then(r => r.json())
.then(res => {
alert(res.message);
load();
});
}

// ================= EDIT =================
function updateData(){

const id = val("id");
const name = val("name");
const coin = val("coin");
const link = val("link");
const cooldown = val("cooldown");

fetch(`${API}?action=edit&password=${PASSWORD}&id=${id}&name=${encodeURIComponent(name)}&coin=${coin}&link=${encodeURIComponent(link)}&cooldown=${cooldown}`)
.then(r => r.json())
.then(res => {
alert(res.message);
load();
});
}

// ================= DELETE =================
function deleteData(){

const id = val("id");

fetch(`${API}?action=delete&password=${PASSWORD}&id=${id}`)
.then(r => r.json())
.then(res => {
alert(res.message);
load();
});
}

// ================= TOOLS =================
function val(id){
return document.getElementById(id).value;
}

function idVal(){
return Date.now(); // auto ID biar tidak bentrok
}