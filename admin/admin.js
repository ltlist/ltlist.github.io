const PASSWORD = "ltlist123";

let data = JSON.parse(localStorage.getItem("ltlist_admin") || "[]");
let editIndex = -1;

const list = document.getElementById("list");

function login(){

const pass = document.getElementById("adminPassword").value;

if(pass === PASSWORD){

document.getElementById("loginBox").style.display = "none";
document.getElementById("adminPanel").style.display = "block";

render();

}else{

document.getElementById("loginMsg").innerHTML =
"❌ Password salah";

}

}

function saveData(){
localStorage.setItem(
"ltlist_admin",
JSON.stringify(data)
);
}

function resetForm(){

nama.value = "";
koin.value = "MULTI";
link.value = "";
cooldown.value = "";

editIndex = -1;

}

function saveFaucet(){

const item = {

id: Date.now().toString(),
nama: nama.value.trim(),
koin: koin.value,
link: link.value.trim(),
cooldown: Number(cooldown.value)

};

if(
!item.nama ||
!item.link ||
!item.cooldown
){
alert("Lengkapi data");
return;
}

const duplicate = data.find(
x => x.link === item.link &&
data.indexOf(x) !== editIndex
);

if(duplicate){
alert("Link faucet sudah ada");
return;
}

if(editIndex === -1){

data.push(item);

}else{

data[editIndex] = {
...data[editIndex],
...item
};

}

saveData();
render();
resetForm();

}

function render(){

const keyword =
document.getElementById("search")
.value
.toLowerCase();

list.innerHTML = "";

let filtered = data.filter(x =>
x.nama.toLowerCase().includes(keyword)
);

filtered.forEach((x,i)=>{

list.innerHTML += `

<tr>
<td>${i+1}</td>
<td>${x.nama}</td>
<td>${x.koin}</td>
<td>${x.cooldown}</td>
<td><button
class="btn-edit"
onclick="editItem(${data.indexOf(x)})">
Edit
</button>

<button
class="btn-delete"
onclick="deleteItem(${data.indexOf(x)})">
Hapus
</button>

</td>
</tr>
`;});

}

function editItem(i){

editIndex = i;

nama.value = data[i].nama;
koin.value = data[i].koin;
link.value = data[i].link;
cooldown.value = data[i].cooldown;

window.scrollTo({
top:0,
behavior:"smooth"
});

}

function deleteItem(i){

if(!confirm("Hapus faucet ini?"))
return;

data.splice(i,1);

saveData();
render();

}

function exportJSON(){

const blob = new Blob(
[
JSON.stringify(data,null,2)
],
{
type:"application/json"
}
);

const a =
document.createElement("a");

a.href =
URL.createObjectURL(blob);

a.download =
"faucet.json";

a.click();

}

function importJSON(){

const file =
document.getElementById("importFile")
.files[0];

if(!file){
alert("Pilih file JSON");
return;
}

const reader =
new FileReader();

reader.onload = e => {

try{

const json =
JSON.parse(e.target.result);

if(!Array.isArray(json))
throw "Invalid";

data = json;

saveData();
render();

alert("Import berhasil");

}catch{

alert("Format JSON tidak valid");

}

};

reader.readAsText(file);

}