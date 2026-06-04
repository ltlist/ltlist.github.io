const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const DATA_URL = "https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// TIMER
function getLast(id){
return localStorage.getItem("c_"+id);
}

function setLast(id){
localStorage.setItem("c_"+id,Date.now());
}

function canClaim(item){
const last=getLast(item.id);
if(!last)return true;
return (Date.now()-last)/60000 >= item.cooldown;
}

function remain(item){
const last=getLast(item.id);
if(!last)return 0;
let r=item.cooldown-((Date.now()-last)/60000);
return r>0?Math.ceil(r):0;
}

// LOAD
async function load(){
try{
let res=await fetch(DATA_URL);
data=await res.json();
document.getElementById("kotakPesan").innerText="OK data loaded";
render();
}catch(e){
document.getElementById("kotakPesan").innerText="ERROR load data";
}
}

// RENDER
function render(){
let f=[...data];

let k=search.value.toLowerCase();
if(k)f=f.filter(x=>x.nama.toLowerCase().includes(k));

if(filterKoin.value!="all")
f=f.filter(x=>x.koin==filterKoin.value);

f.sort((a,b)=>sortAsc?a.nama.localeCompare(b.nama):b.nama.localeCompare(a.nama));

tbody.innerHTML="";

f.forEach((x,i)=>{
let ready=canClaim(x);
let r=remain(x);

tbody.innerHTML+=`
<tr>
<td>${i+1}</td>
<td>${x.nama}</td>
<td>${x.koin}</td>
<td>${x.trust}</td>
<td>${x.reward}</td>
<td>
${ready?
`<a href="${x.link}" target="_blank" onclick="setLast('${x.id}')">Claim</a>`
:`⏳ ${r}m`}
</td>
</tr>
`;
});
}

// EVENTS
search.oninput=render;
filterKoin.onchange=render;

sortBtn.onclick=()=>{
sortAsc=!sortAsc;
render();
}

load();
setInterval(render,30000);