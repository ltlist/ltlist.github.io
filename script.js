const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const URL = "https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// LOAD
async function load(){
try{
let res = await fetch(URL);
data = await res.json();
document.getElementById("kotakPesan").innerText = "Data loaded";
render();
}catch(e){
document.getElementById("kotakPesan").innerText = "Error load data";
}
}

// RENDER
function render(){

let f = [...data];

// search
let k = search.value.toLowerCase();
if(k) f = f.filter(x => x.nama.toLowerCase().includes(k));

// filter
if(filterKoin.value!="all")
f = f.filter(x => x.koin==filterKoin.value);

// sort
f.sort((a,b)=>
sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
);

tbody.innerHTML="";

f.forEach((x,i)=>{
tbody.innerHTML+=`
<tr>
<td>${i+1}</td>
<td>${x.nama}</td>
<td>${x.koin}</td>
<td>${x.reward}</td>
<td><a href="${x.link}" target="_blank">Claim</a></td>
</tr>`;
});
}

// EVENTS
search.oninput=render;
filterKoin.onchange=render;

sortBtn.onclick=()=>{
sortAsc=!sortAsc;
render();
};

load();