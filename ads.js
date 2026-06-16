document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.dataset.network;
    let iframe = "";

    if (network === "zerads-468") {
      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          width="468"
          height="60"
          frameborder="0"
          scrolling="no">
        </iframe>
      `;
    }

    else if (network === "zerads-300") {
      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11338"
          width="300"
          height="250"
          frameborder="0"
          scrolling="no">
        </iframe>
      `;
    }

    el.innerHTML = iframe;

  });

});