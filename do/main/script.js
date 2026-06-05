const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const DATA_URL =
"https://raw.githubusercontent.com/ltlist/ltlist.github.io/coin/do/coin/faucet.json";

// ================= TIMER =================
function getLast(id){
return localStorage.getItem("claim_" + id);
}

function setLast(id){
localStorage.setItem("claim_" + id, Date.now());
}

function remainingSeconds(item){
const last = getLast(item.id);
if(!last) return 0;

const diff = Math.floor((Date.now() - last) / 1000);
const cooldown = item.cooldown * 60;

const left = cooldown - diff;
return left > 0 ? left : 0;
}

function formatTime(sec){
const m = Math.floor(sec / 60);
const s = sec % 60;
return `${m}m ${s}s`;
}

function canClaim(item){
return remainingSeconds(item) === 0;
}

// ================= LOAD DATA =================
async function loadData(){
try{
const res = await fetch(DATA_URL);
data = await res.json();

document.getElementById("kotakPesan").innerText =
"✅ Data loaded";

render();

}catch(e){
document.getElementById("kotakPesan").innerText =
"❌ Failed load data";
}
}

// ================= RENDER =================
function render(){

let list = [...data];

// search
const keyword = search.value.toLowerCase();
if(keyword){
list = list.filter(x =>
x.nama.toLowerCase().includes(keyword)
);
}

// filter coin
if(filterKoin.value !== "all"){
list = list.filter(x => x.koin === filterKoin.value);
}

// sort
list.sort((a,b)=>
sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
);

tbody.innerHTML="";

list.forEach((item,i)=>{

const left = remainingSeconds(item);
const ready = left === 0;

tbody.innerHTML += `
<tr>
<td>${i+1}</td>
<td>${item.nama}</td>
<td><span class="coin">${item.koin}</span></td>
<td>
${
ready
? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">Claim</a>`
: `<button class="btn disabled">⏳ ${formatTime(left)}</button>`
}
</td>
</tr>
`;
});
}

// ================= EVENTS =================
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
sortAsc = !sortAsc;
render();
});

// ================= INIT =================
loadData();
setInterval(render, 1000);
