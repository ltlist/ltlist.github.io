const tbody = document.getElementById("tbody");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const sortBtn = document.getElementById("sortBtn");
const status = document.getElementById("status");

let data = [
  { id:1, nama:"Vie Faucet", koin:"MULTI", link:"#"},
  { id:2, nama:"Coin Diversity", koin:"DOGE", link:"#"},
  { id:3, nama:"Litecoin Faucet", koin:"LTC", link:"#"}
];

let asc = true;

function render(){
  let list = [...data];

  const q = search.value.toLowerCase();
  if(q){
    list = list.filter(x => x.nama.toLowerCase().includes(q));
  }

  if(filter.value !== "all"){
    list = list.filter(x => x.koin === filter.value);
  }

  list.sort((a,b)=>
    asc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
  );

  tbody.innerHTML = "";

  list.forEach((item,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${item.nama}</td>
        <td>${item.koin}</td>
        <td><a href="${item.link}" target="_blank">Claim</a></td>
      </tr>
    `;
  });

  status.innerText = "Loaded ✔";
}

search.addEventListener("input", render);
filter.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  asc = !asc;
  render();
});

render();