// Konfigurasi
const SEMUA_KOIN = ["all", "LTC", "BTC", "TRX", "DOGE", "USDT", "BCH", "SOL", "ZEC", "TON", "DASH"];
// Ambil dari folder sendiri, aman tanpa masalah CORS
const DATA_URL = "./faucets.json";

let faucets = [];

// Ambil data
async function loadFaucetData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("File tidak ditemukan");
    
    faucets = await response.json();
    buatFilterKoin();
    tampilkanFaucet();
  } catch (error) {
    console.error("Gagal:", error);
    document.getElementById("faucetList").innerHTML = `
      <tr><td colspan="5" style="text-align:center; padding:2rem; color:#ff6b6b;">
        ❌ Gagal memuat data
      </td></tr>
    `;
  }
}

// Hitung jumlah
function hitungJumlahFaucet() {
  const jumlah = {};
  const aktif = faucets.filter(f => f.active);
  jumlah["all"] = aktif.length;
  
  SEMUA_KOIN.slice(1).forEach(koin => {
    jumlah[koin] = aktif.filter(f => f.coin === koin).length;
  });
  return jumlah;
}

// Buat filter
function buatFilterKoin() {
  const wadah = document.getElementById("filterContainer");
  const jumlah = hitungJumlahFaucet();
  wadah.innerHTML = "";

  SEMUA_KOIN.forEach((koin, indeks) => {
    const elemen = document.createElement("label");
    elemen.className = "radio-item";
    const teks = jumlah[koin] > 0 ? `${koin} (${jumlah[koin]})` : koin;
    
    elemen.innerHTML = `
      <input type="radio" name="filterKoin" value="${koin}" ${indeks === 0 ? "checked" : ""}>
      ${teks}
    `;
    wadah.appendChild(elemen);
  });

  document.querySelectorAll('input[name="filterKoin"]').forEach(pilihan => {
    pilihan.addEventListener("change", (e) => tampilkanFaucet(e.target.value));
  });
}

// Tampilkan tabel
function tampilkanFaucet(filter = "all") {
  const wadahTabel = document.getElementById("faucetList");
  wadahTabel.innerHTML = "";

  let data = faucets.filter(f => f.active);
  if (filter !== "all") data = data.filter(f => f.coin === filter);

  if (data.length === 0) {
    wadahTabel.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;">Belum ada data</td></tr>`;
    return;
  }

  data.forEach((faucet, no) => {
    const baris = document.createElement("tr");
    baris.innerHTML = `
      <td>${no + 1}</td>
      <td><a href="${faucet.url}" target="_blank">${faucet.name}</a></td>
      <td>${faucet.coin}</td>
      <td class="trust">${"✓".repeat(faucet.trust)}</td>
      <td class="stars">${"★".repeat(faucet.stars)}</td>
    `;
    wadahTabel.appendChild(baris);
  });
}

window.addEventListener("load", loadFaucetData);
