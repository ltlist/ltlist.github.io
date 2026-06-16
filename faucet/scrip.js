document.addEventListener("DOMContentLoaded", () => {
const COOLDOWN = 60 * 60 * 1000; // 60 minutes
const REWARD = 160;
const API_KEY = "0x4AAAAAADk00FmP5a2Feee3"; // <-- REPLACE THIS

const emojis = [{name:'cat', icon:'🐱'}, {name:'dog', icon:'🐶'}, {name:'rabbit', icon:'🐰'}, {name:'cow', icon:'🐮'}, {name:'lion', icon:'🦁'}];
let correctNum, correctEmoji, chosenEmoji = '';

const modal = document.getElementById('claimModal');
const mainBtn = document.getElementById('mainClaimBtn'); // NEXT Button
const closeBtn = document.getElementById('closeModal');
const resultDiv = document.getElementById('result');

// Check Cooldown on load
function checkCooldown(){
  const endTime = localStorage.getItem("ltcCooldown");
  if(endTime && new Date().getTime() < endTime){
    startTimer(endTime);
  } else {
    mainBtn.innerText = "NEXT"; 
    mainBtn.disabled = false;
  }
}
checkCooldown();

function startTimer(endTime){
  mainBtn.disabled = true;
  const timer = setInterval(() => {
    const distance = endTime - new Date().getTime();
    if (distance < 0) {
      clearInterval(timer);
      mainBtn.innerText = "NEXT"; 
      mainBtn.disabled = false;
      localStorage.removeItem("ltcCooldown");
      return;
    }
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);
    mainBtn.innerText = `Wait ${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}

// 1. Click NEXT = Open Modal. No cooldown check here.
mainBtn.onclick = () => {
  let a = Math.floor(Math.random() * 10);
  let b = Math.floor(Math.random() * 10);
  correctNum = a + b;
  document.getElementById('mathQ').innerText = `${a} + ${b}`;

  let pick = emojis[Math.floor(Math.random() * emojis.length)];
  correctEmoji = pick.name;
  document.getElementById('emojiQ').innerText = pick.icon;
  
  let shuffled = [...emojis].sort(() => 0.5 - Math.random());
  document.getElementById('animalBox').innerHTML = shuffled.map(e => `<button class="emojiBtn" data-name="${e.name}">${e.icon}<br>${e.name}</button>`).join('');
  
  document.getElementById('mathAnswer').value = ''; // Reset input
  chosenEmoji = '';
  modal.style.display = 'flex';
}

// Close Modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if(e.target == modal) modal.style.display = 'none'; }

// Select Emoji
document.addEventListener('click', e => {
  if(e.target.classList.contains('emojiBtn')){
    document.querySelectorAll('.emojiBtn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    chosenEmoji = e.target.dataset.name;
  }
});

// 2. Click CLAIM in Popup = Verify + Start Cooldown
document.getElementById('finalClaimBtn').onclick = async () => {
  const email = document.getElementById('username').value;
  if(!email) return alert('Please enter your FaucetPay Email first!');
  if(!turnstile.getResponse()) return alert('Please complete the Cloudflare verification first!');
  if(parseInt(document.getElementById('mathAnswer').value) !== correctNum) return alert('Wrong math answer! Click NEXT to try again.');
  if(chosenEmoji !== correctEmoji) return alert('Wrong emoji! Click NEXT to try again.');

  modal.style.display = 'none';
  resultDiv.innerText = "Sending to Faucetpay...";
  mainBtn.disabled = true; 

  try {
    const res = await fetch(`https://faucetpay.io/api/v1/send?api_key=${API_KEY}&to=${email}&amount=${REWARD}&currency=LTC`);
    const data = await res.json();
    
    if(data.status === 200){
      resultDiv.innerText = `Success! ${REWARD} Litoshi sent.`;
      addHistory(email, REWARD);
      // ===== COOLDOWN ONLY SETS HERE ON SUCCESS =====
      const endTime = new Date().getTime() + COOLDOWN;
      localStorage.setItem("ltcCooldown", endTime);
      startTimer(endTime);
    } else {
      resultDiv.innerText = `Failed: ${data.message}`;
      mainBtn.disabled = false; // Failed = NEXT button active again
    }
  } catch(err){
    resultDiv.innerText = "API connection error.";
    mainBtn.disabled = false;
  }
};

function addHistory(email, amount){
  let history = JSON.parse(localStorage.getItem("ltcHistory") || "[]");
  history.unshift({user: email.slice(0,4)+'***', amount: amount/100000, time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})});
  if(history.length > 5) history.pop();
  localStorage.setItem("ltcHistory", JSON.stringify(history));
  document.getElementById('history').innerHTML = history.map(h => `<li class="small">${h.user} ${h.amount} | ${h.time}</li>`).join('');
}
loadHistory();
function loadHistory(){
  let history = JSON.parse(localStorage.getItem("ltcHistory") || "[]");
  document.getElementById('history').innerHTML = history.map(h => `<li class="small">${h.user} ${h.amount} | ${h.time}</li>`).join('');
}
});