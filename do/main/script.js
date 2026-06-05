const tbody = document.getElementById("isiTabel");
const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");
const pesan = document.getElementById("kotakPesan");

let data = [];
let sortAsc = true;

// ================= DATA SOURCE (GITHUB JSON) =================
const DATA_URL = "https://alif.unaux.com/api/faucets.php";

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

    const diff = Math.floor((Date.now() - Number(last)) / 1000);
    const cooldown = Number(item.cooldown) * 60;
    const left = cooldown - diff;

    return left > 0 ? left : 0;
}

function formatTime(sec){
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
}

// ================= LOAD DATA =================
async function loadData(){
    try{
        if(pesan) pesan.innerText = "Loading data...";

        const res = await fetch(DATA_URL, {
            cache: "no-store"
        });

        if(!res.ok){
            throw new Error("HTTP " + res.status);
        }

        const json = await res.json();

        if(!Array.isArray(json)){
            throw new Error("Format JSON salah");
        }

        data = json;

        if(pesan){
            pesan.innerText = `✅ ${data.length} faucets loaded`;
        }

        render();

    }catch(e){
        console.error("LOAD ERROR:", e);

        if(pesan){
            pesan.innerText = "❌ Gagal load data: " + e.message;
        }
    }
}

// ================= RENDER =================
function render(){
    if(!tbody) return;

    let list = [...data];

    // SEARCH
    const keyword = search.value.toLowerCase();
    if(keyword){
        list = list.filter(item =>
            item.nama.toLowerCase().includes(keyword)
        );
    }

    // FILTER COIN
    if(filterKoin.value !== "all"){
        list = list.filter(item =>
            item.koin === filterKoin.value
        );
    }

    // SORT
    list.sort((a,b)=>
        sortAsc
        ? a.nama.localeCompare(b.nama)
        : b.nama.localeCompare(a.nama)
    );

    tbody.innerHTML = "";

    list.forEach((item,index)=>{
        const left = remainingSeconds(item);

        let tombol = "";

        if(left === 0){
            tombol = `
                <a class="btn"
                   href="${item.link}"
                   target="_blank"
                   onclick="setLast('${item.id}')">
                   Claim
                </a>`;
        }else{
            tombol = `
                <button class="btn disabled">
                    ⏳ ${formatTime(left)}
                </button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.nama}</td>
                <td><span class="coin">${item.koin}</span></td>
                <td>${tombol}</td>
            </tr>
        `;
    });

    if(list.length === 0){
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No faucet found</td>
            </tr>
        `;
    }
}

// ================= EVENTS =================
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", () => {
    sortAsc = !sortAsc;
    render();
});

// ================= INIT =================
loadData();
setInterval(render, 1000);