// DAFTAR SEMUA FAUCET - EDIT FILE INI SAJA!
const daftarFaucet = [
  {
    nama: "FreeBitcoin",
    kategori: "btc",
    status: "Terpercaya",
    deskripsi: "Klaim Bitcoin setiap jam, ada undian dan bunga saldo",
    koin: "BTC",
    waktu: "Setiap 60 menit",
    link: "https://freebitco.in"
  },
  {
    nama: "Cointiply",
    kategori: "btc",
    status: "Populer",
    deskripsi: "Dapatkan koin dari faucet, survei, dan menonton iklan",
    koin: "BTC/ETH",
    waktu: "Setiap jam",
    link: "https://cointiply.com"
  },
  {
    nama: "FaucetCrypto",
    kategori: "lainnya",
    status: "Aktif",
    deskripsi: "Pilihan 15+ koin, klaim setiap 30 menit, penarikan cepat",
    koin: "DOGE/LTC/TRX",
    waktu: "Setiap 30 menit",
    link: "https://faucetcrypto.com"
  }
  // ✅ TAMBAH FAUCET BARU DI BAWAH INI
  // Contoh format tambahan:
  // ,{
  //   nama: "Nama Faucet Kamu",
  //   kategori: "btc/eth/doge/lainnya",
  //   status: "Baru/Aktif/Terpercaya",
  //   deskripsi: "Penjelasan singkat",
  //   koin: "Jenis koinnya",
  //   waktu: "Misal: Setiap 15 menit",
  //   link: "https://link-faucet-kamu.com"
  // }
];

// Render daftar faucet ke halaman
function tampilkanFaucet() {
  const wadah = document.getElementById("faucetList");
  wadah.innerHTML = "";

  daftarFaucet.forEach(faucet => {
    const kartu = document.createElement("div");
    kartu.className = "bg-white rounded-xl shadow-sm p-5 card-hover faucet-item";
    kartu.dataset.kategori = faucet.kategori;

    kartu.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-semibold text-slate-800">${faucet.nama}</h3>
        <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">${faucet.status}</span>
      </div>
      <p class="text-slate-600 text-sm mb-3">${faucet.deskripsi}</p>
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">${faucet.koin}</span>
        <span class="text-xs bg-slate-100 px-2 py-1 rounded">${faucet.waktu}</span>
      </div>
      <a href="${faucet.link}" target="_blank" rel="nofollow" class="block w-full text-center bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-medium transition">
        <i class="fa fa-external-link mr-1"></i> Kunjungi Sekarang
      </a>
    `;

    wadah.appendChild(kartu);
  });

  // Tambah fungsi filter dan pencarian setelah data dimuat
  tambahFiturFilter();
}

// Fungsi filter dan pencarian
function tambahFiturFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search');
  const faucetItems = document.querySelectorAll('.faucet-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active', 'bg-primary', 'text-white'));
      filterButtons.forEach(b => b.classList.add('bg-slate-100'));
      btn.classList.add('active', 'bg-primary', 'text-white');
      btn.classList.remove('bg-slate-100');

      const filter = btn.dataset.filter;
      document.querySelectorAll('.faucet-item').forEach(item => {
        item.style.display = (filter === 'semua' || item.dataset.kategori === filter) ? 'block' : 'none';
      });
    });
  });

  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    document.querySelectorAll('.faucet-item').forEach(item => {
      const nama = item.querySelector('h3').textContent.toLowerCase();
      const deskripsi = item.querySelector('p').textContent.toLowerCase();
      item.style.display = (nama.includes(keyword) || deskripsi.includes(keyword)) ? 'block' : 'none';
    });
  });
}

// Jalankan saat halaman selesai dimuat
window.onload = tampilkanFaucet;
