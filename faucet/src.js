let adBlockDetected = false;

function detectAdBlock() {

  const iframe = document.querySelector(
    'iframe[src*="zerads.com"]'
  );

  if (!iframe) return true;

  const style = getComputedStyle(iframe);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    iframe.offsetWidth < 50 ||
    iframe.offsetHeight < 20
  ) {
    return true;
  }

  const rect = iframe.getBoundingClientRect();

  if (
    rect.width < 50 ||
    rect.height < 20
  ) {
    return true;
  }

  return false;
}

function showBlock() {
  adBlockDetected = true;

  const overlay = document.getElementById("adblock-overlay");
  const main = document.getElementById("main");

  if (overlay) overlay.style.display = "flex";
  if (main) main.style.display = "none";
}

function hideBlock() {

  const overlay = document.getElementById("adblock-overlay");
  const main = document.getElementById("main");

  if (overlay) overlay.style.display = "none";
  if (main) main.style.display = "block";

  adBlockDetected = false;
}

function checkAdBlock() {

  if (detectAdBlock()) {
    showBlock();
  } else {
    hideBlock();
  }

}

window.addEventListener("load", () => {

  setTimeout(checkAdBlock, 5000);

  setInterval(() => {

    if (!adBlockDetected) {
      checkAdBlock();
    }

  }, 10000);

});