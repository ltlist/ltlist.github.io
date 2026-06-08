document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.getAttribute("data-network");

    let iframe = "";

    // =========================
    // ZERADS
    // =========================
    if (network === "zerads") {
      iframe = `
        <iframe
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          marginwidth="0"
          marginheight="0"
          width="468"
          height="60"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;">
        </iframe>
      `;
    }

    // =========================
    // A-ADS
    // =========================
    else if (network === "aads") {
      iframe = `
        <iframe
          src="https://a-ads.com/your-ad-link"
          width="300"
          height="250"
          scrolling="no"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
          style="border:0;overflow:hidden;">
        </iframe>
      `;
    }

    // =========================
    // FAUCETPAY ADS
    // =========================
    else if (network === "faucetpay") {
      iframe = `
        <iframe
          src="https://faucetpay.io/advertise"
          width="468"
          height="60"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;">
        </iframe>
      `;
    }

    // INSERT INTO PAGE
    el.innerHTML = `
      <div class="ad-banner">
        <div class="ad-label">Advertisement</div>
        <div class="ad-box">
          ${iframe}
        </div>
      </div>
    `;

  });

});