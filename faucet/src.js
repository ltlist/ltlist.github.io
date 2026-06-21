function detectAdBlock() {

  const iframe = document.querySelector(
    'iframe[src*="zerads.com"]'
  );

  if (!iframe) {
    return true;
  }

  const style = window.getComputedStyle(iframe);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    iframe.offsetWidth === 0 ||
    iframe.offsetHeight === 0
  ) {
    return true;
  }

  return false;
}


function showBlock() {
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
}


function checkAdBlock() {

  if (detectAdBlock()) {
    showBlock();
  } else {
    hideBlock();
  }

}


window.addEventListener("load", () => {

  setTimeout(() => {
    checkAdBlock();
  }, 5000);

});