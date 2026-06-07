const API =
"https://script.google.com/macros/s/AKfycbyi-AhsKNTbctSLL-gAok78XZEN7M1t2OS3X0-ufNUpzmyyOi2CyABvRFdEnEf4oSck/exec";

const PASSWORD = "ltlis123";

// ================= LOAD DATA =================
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
<td><a href="${d.link}" target="_blank">link</a></td>
<td>${d.cooldown}</td>
</tr>
`;
});

document.getElementById("table").innerHTML = html;
}

load();

// ================= ADD =================
function addData(){

const id = document.getElementById("id").value;
const name = document.getElementById("name").value;
const coin = document.getElementById("coin").value;
const link = document.getElementById("link").value;
const cooldown = document.getElementById("cooldown").value;

const url =
`${API}?action=add&password=${PASSWORD}&id=${id}&name=${name}&coin=${coin}&link=${link}&cooldown=${cooldown}`;

fetch(url)
.then(r => r.json())
.then(() => {
alert("Data ditambah");
load();
});
}

// ================= EDIT =================
function updateData(){

const id = document.getElementById("id").value;
const name = document.getElementById("name").value;
const coin = document.getElementById("coin").value;
const link = document.getElementById("link").value;
const cooldown = document.getElementById("cooldown").value;

const url =
`${API}?action=edit&password=${PASSWORD}&id=${id}&name=${name}&coin=${coin}&link=${link}&cooldown=${cooldown}`;

fetch(url)
.then(r => r.json())
.then(() => {
alert("Data diupdate");
load();
});
}

// ================= DELETE =================
function deleteData(){

const id = document.getElementById("id").value;

const url =
`${API}?action=delete&password=${PASSWORD}&id=${id}`;

fetch(url)
.then(r => r.json())
.then(() => {
alert("Data dihapus");
load();
});
}