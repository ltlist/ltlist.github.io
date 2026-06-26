document.addEventListener("DOMContentLoaded", () => {

  // Load Surfe script sekali saja
  if (!document.querySelector('script[src="//static.surfe.pro/js/net.js"]')) {
    const s = document.createElement("script");
    s.src = "//static.surfe.pro/js/net.js";
    document.head.appendChild(s);
  }

  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.dataset.network;
    let html = "";

    if (network === "zerads-468") {
      html = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11448"
          width="468"
          height="60"
          frameborder="0"
          scrolling="no">
        </iframe>
      `;
    }

    else if (network === "zerads-300") {
      html = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11448"
          width="300"
          height="250"
          frameborder="0"
          scrolling="no">
        </iframe>
      `;
    }

    else if (network === "surfe") {
      html = `
        <ins class="surfe-be" data-sid="421402"></ins>
      `;
    }

    el.innerHTML = html;

    // Jalankan Surfe setelah elemen dibuat
    if (network === "surfe" && window.adsurfebe) {
      window.adsurfebe.push({});
    }

  });

});