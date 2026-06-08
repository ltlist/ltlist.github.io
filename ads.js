document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll(".ad-slot").forEach(el => {

    const type = el.getAttribute("data-type");

    // =========================
    // ZERADS
    // =========================
    if (type === "zerads") {
      el.innerHTML = `
        <div id="zerads-container"></div>
        <script src="https://zerads.com/ad.js"></script>
      `;
    }

    // =========================
    // A-ADS
    // =========================
    else if (type === "aads") {
      el.innerHTML = `
        <!-- A-ADS -->
        <ins class="a-ads"
          data-ad-client="YOUR_ID"
          data-ad-slot="YOUR_SLOT"
          style="display:block"></ins>
        <script src="https://a-ads.com/js/ads.js"></script>
        <script>
          if(window.aads) aads.init();
        </script>
      `;
    }

    // =========================
    // FAUCETPAY ADS
    // =========================
    else if (type === "faucetpay") {
      el.innerHTML = `
        <iframe
          src="https://faucetpay.io/advertise"
          style="width:100%;height:60px;border:0;overflow:hidden;">
        </iframe>
      `;
    }

  });

});