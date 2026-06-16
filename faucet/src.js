function detectZERAds() {

  const frame = document.querySelector(
    'iframe[src*="zerads.com"]'
  );

  if (!frame) return true;

  if (
    frame.offsetWidth === 0 ||
    frame.offsetHeight === 0
  ) {
    return true;
  }

  return false;
}

function showBlock() {
  document.getElementById("adblock-overlay").style.display = "flex";
  document.getElementById("main").style.display = "none";
}

function hideBlock() {
  document.getElementById("adblock-overlay").style.display = "none";
  document.getElementById("main").style.display = "block";
}

function checkAdBlock() {

  if (detectZERAds()) {
    showBlock();
  } else {
    hideBlock();
  }

}

window.addEventListener("load", () => {
  setTimeout(checkAdBlock, 3000);
});