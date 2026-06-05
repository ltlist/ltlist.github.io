const tbody = document.getElementById("isiTabel");
const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let dataFaucet = [];
let sortAsc = true;

// 🔥 LINK RAW GITHUB JSON
const DATA_URL = "https://alif.unaux.com/api/faucets.php";

// ===== FETCH DATA =====
async function fetchData() {
    try {
        const res = await fetch(DATA_URL);
        dataFaucet = await res.json();

        document.getElementById("kotakPesan").innerText =
            "✅ Data berhasil dimuat dari GitHub";

        loadData();
    } catch (err) {
        document.getElementById("kotakPesan").innerText =
            "❌ Gagal memuat data faucet";
        console.error(err);
    }
}

// ===== TIMER =====
function getLast(id) {
    return localStorage.getItem("claim_" + id);
}

function setLast(id) {
    localStorage.setItem("claim_" + id, Date.now());
}

function canClaim(item) {
    const last = getLast(item.id);
    if (!last) return true;

    const diff = (Date.now() - last) / 60000;
    return diff >= item.cooldown;
}

function remaining(item) {
    const last = getLast(item.id);
    if (!last) return 0;

    const diff = (Date.now() - last) / 60000;
    const left = item.cooldown - diff;
    return left > 0 ? Math.ceil(left) : 0;
}

// ===== RENDER =====
function loadData() {

    let filtered = [...dataFaucet];

    const keyword = search.value.toLowerCase();
    if (keyword) {
        filtered = filtered.filter(f =>
            f.nama.toLowerCase().includes(keyword)
        );
    }

    if (filterKoin.value !== "all") {
        filtered = filtered.filter(f => f.koin === filterKoin.value);
    }

    filtered.sort((a, b) =>
        sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
    );

    tbody.innerHTML = "";

    filtered.forEach((item, i) => {

        const ready = canClaim(item);
        const left = remaining(item);

        tbody.innerHTML += `
        <tr>
            <td>${i + 1}</td>
            <td>${item.nama}</td>
            <td><span class="lencana-koin">${item.koin}</span></td>
            <td class="kepercayaan">${item.trust}</td>
            <td>${item.reward}</td>
            <td>
                ${
                    ready
                    ? `<a class="tombol-klaim" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">Claim</a>`
                    : `<button class="tombol-klaim" disabled>⏳ ${left}m</button>`
                }
            </td>
        </tr>
        `;
    });
}

// expose
window.setLast = setLast;

// ===== EVENTS =====
search.addEventListener("input", loadData);
filterKoin.addEventListener("change", loadData);

sortBtn.addEventListener("click", () => {
    sortAsc = !sortAsc;
    loadData();
});

// ===== INIT =====
fetchData();
setInterval(loadData, 30000);