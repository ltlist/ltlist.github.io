let data = JSON.parse(localStorage.getItem("adm") || "[]");

const list = document.getElementById("list");

function render(){
list.innerHTML="";

data.forEach((x,i)=>{
list.innerHTML += `
<tr>
<td>${x.nama}</td>
<td>${x.koin}</td>
<td><button onclick="del(${i})">Hapus</button></td>
</tr>`;
});

localStorage.setItem("adm", JSON.stringify(data));
}

function add(){
data.push({
id: Date.now().toString(),
nama: nama.value,
koin: koin.value,
link: link.value,
cooldown: Number(cooldown.value)
});

render();
}

function del(i){
data.splice(i,1);
render();
}

function exportJSON(){
let blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
let a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "faucet.json";
a.click();
}

render();
