// Data lengkap
const DATA_FAUCET = {
  "site_info": {
    "title": "LTList • Koleksi Faucet Terbaik",
    "description": "Daftar faucet kripto terpercaya, terbukti membayar!"
  },
  "faucet_list": [
    {
      "id": 1,
      "nama": "FaucetCrypto",
      "koin": "BTC / LTC / DOGE / BCH",
      "tingkat_kepercayaan": "⭐⭐⭐⭐⭐ SANGAT AMAN",
      "estimasi_hadiah": "0.000001 - 0.001 BTC",
      "jadwal_klaim": "Setiap 5 Menit",
      "tautan_rujukan": "https://faucetcrypto.com/ref/GANTI_KODE_RUJUKAN"
    },
    {
      "id": 2,
      "nama": "Cointiply",
      "koin": "BTC / DOGE / DASH / LTC",
      "tingkat_kepercayaan": "⭐⭐⭐⭐⭐ TERPERCAYA",
      "estimasi_hadiah": "Bervariasi hingga 50.000 koin/hari",
      "jadwal_klaim": "Setiap Jam",
      "tautan_rujukan": "https://cointiply.com/r/GANTI_KODE_RUJUKAN"
    },
    {
      "id": 3,
      "nama": "FreeBitcoin",
      "koin": "BTC",
      "tingkat_kepercayaan": "⭐⭐⭐⭐ AMAN",
      "estimasi_hadiah": "Hingga $200 + Bunga 4.08%",
      "jadwal_klaim": "Setiap Jam",
      "tautan_rujukan": "https://freebitco.in/?r=GANTI_KODE_RUJUKAN"
    },
    {
      "id": 4,
      "nama": "FireFaucet.win",
      "koin": "SEMUA KRIPTO POPULER",
      "tingkat_kepercayaan": "⭐⭐⭐⭐ SANGAT BAGUS",
      "estimasi_hadiah": "Bonus harian + tugas tambahan",
      "jadwal_klaim": "Setiap 30 Menit",
      "tautan_rujukan": "https://firefaucet.win/?ref=GANTI_KODE_RUJUKAN"
    }
  ]
};

window.onload = tampilkanData;

function tampilkanData() {
  const tabel = document.getElementById("isiTabel");
  const pesan = document.getElementById("pesan");

  pesan.className = "kotak pesan-berhasil";
  pesan.textContent = `✅ Berhasil memuat ${DATA_FAUCET.faucet_list.length} faucet terpercaya!`;

  tabel.innerHTML = "";
  DATA_FAUCET.faucet_list.forEach((item, indeks) => {
    const baris = document.createElement("tr");
    baris.innerHTML = `
      <td>${indeks + 1}</td>
      <td><strong>${item.nama}</strong></td>
      <td><span class="lencana-koin">${item.koin}</span></td>
      <td><span class="bintang">${item.tingkat_kepercayaan}</span></td>
      <td>${item.estimasi_hadiah}<span class="waktu">⏱️ ${item.jadwal_klaim}</span></td>
      <td><a href="${item.tautan_rujukan}" target="_blank" rel="noopener noreferrer nofollow" class="tombol-klaim">Klaim Sekarang</a></td>
    `;
    tabel.appendChild(baris);
  });
}
