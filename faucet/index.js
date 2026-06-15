const REWARD = "0.00000160 LTC";
const COOLDOWN = 60 * 60 * 1000;
const MAX_DAILY = 7;
const IP_LOCK_TIME = 24 * 60 * 60 * 1000;
const WORKER_URL = "https://calm-art-584f.cnamelist.workers.dev"; // <- GANTI URL KAMU

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

const HTML = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LTFAUCET</title>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.box{background:#1e293b;padding:24px;border-radius:16px;width:100%;max-width:400px}input,button{width:100%;padding:12px;border-radius:8px;border:0;margin-top:8px}input{background:#334155;color:#fff}button{background:#38bdf8;color:#0f172a;font-weight:700;cursor:pointer}#challengeBox{display:none;margin-top:12px}.animalBtn{width:32%;margin:4px 1%}</style>
</head><body><div class="box"><h2>🚰 LTFAUCET</h2><p>Reward: ${REWARD} LTC / 60 Menit | Max 7/hari</p>
<input id="user" placeholder="Username / Email FaucetPay">
<div id="challengeBox"><p id="q"></p><input id="math" placeholder="Jawaban"><div id="animals"></div></div>
<div class="cf-turnstile" data-sitekey="PASTE_SITE_KEY_KAMU_DISINI"></div> 
<button id="btn">Claim</button><div id="log" style="margin-top:12px;font-size:14px"></div></div>
<script>
const API = '${WORKER_URL}';let sessionId=null,pickedAnimal=null;
const log=t=>document.getElementById('log').innerHTML=t+'<br>'+document.getElementById('log').innerHTML;
async function loadChallenge(){const d=await(await fetch(API+'/api/challenge')).json();sessionId=d.sessionId;document.getElementById('q').innerText='Hitung: '+d.question;document.getElementById('animals').innerHTML=d.animals.map(a=>`<button type=button class=animalBtn onclick="pick('${a}')">${a}</button>`).join('');document.getElementById('challengeBox').style.display='block';}
function pick(a){pickedAnimal=a;document.querySelectorAll('.animalBtn').forEach(b=>b.style.background=b.innerText===a?'#38bdf8':'#334155');}
document.getElementById('btn').onclick=async()=>{const user=document.getElementById('user').value.trim(),token=turnstile.getResponse(),math=document.getElementById('math').value;if(!user||!token||!math||!pickedAnimal)return alert('Isi semua');document.getElementById('btn').disabled=true;const d=await(await fetch(API+'/api/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,token,sessionId,mathAnswer:math,animalAnswer:pickedAnimal})).json();log(d.success?'✅ '+d.message+' Sisa: '+d.remaining:'❌ '+d.error);turnstile.reset();loadChallenge();document.getElementById('btn').disabled=false;};
loadChallenge();</script></body></html>`;

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders } }); }
function generateChallenge() { const a = Math.floor(Math.random() * 10) + 1; const b = Math.floor(Math.random() * 10) + 1; const animals = ["cat", "dog", "rabbit", "cow", "lion"]; return { mathA: String(a + b), animal: animals[Math.floor(Math.random() * animals.length)], question: `${a} + ${b}` }; }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    
    if (url.pathname === "/") return new Response(HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } }); // <- INI KUNCINYA

    if (url.pathname === "/api/challenge") {
      const sessionId = crypto.randomUUID();
      const c = generateChallenge();
      await env.LTFAUCET.put(`challenge:${sessionId}`, JSON.stringify({ mathA: c.mathA, animal: c.animal }), { expirationTtl: 60 });
      return json({ sessionId, question: c.question, animals: ["cat", "dog", "rabbit", "cow", "lion"] });
    }

    if (url.pathname === "/api/claim" && request.method === "POST") {
      try {
        const body = await request.json(); const username = body.username.trim().toLowerCase();
        const ts = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: body.token }) });
        if (!(await ts.json()).success) return json({ success: false, error: "Captcha gagal" });
        const ip = request.headers.get("CF-Connecting-IP");
        if (await env.LTFAUCET.get(`ip:${ip}`)) return json({ success: false, error: "IP lock 24 jam aktif" });
        const session = JSON.parse(await env.LTFAUCET.get(`challenge:${body.sessionId}`) || "null"); if (!session) return json({ success: false, error: "Session expired" });
        if (body.mathAnswer !== session.mathA || body.animalAnswer !== session.animal) return json({ success: false, error: "Jawaban salah" });
        const now = Date.now(); const today = new Date().toISOString().slice(0, 10); const userKey = `user:${username}`;
        let user = JSON.parse(await env.LTFAUCET.get(userKey) || "null") || { lastClaim: 0, claimsToday: 0, day: today }; if (user.day !== today) { user.day = today; user.claimsToday = 0; }
        if (now - user.lastClaim < COOLDOWN) return json({ success: false, error: "Cooldown 60 menit" }); if (user.claimsToday >= MAX_DAILY) return json({ success: false, error: "Limit 7/hari" });
        user.lastClaim = now; user.claimsToday++; await env.LTFAUCET.put(userKey, JSON.stringify(user));
        const payout = await fetch("https://faucetpay.io/api/v1/send", { method: "POST", body: new URLSearchParams({ api_key: env.FAUCETPAY_API_KEY, to: username, amount: REWARD, currency: "LTC" }) });
        if ((await payout.json()).status !== 200) return json({ success: false, error: "Payout gagal" });
        await env.LTFAUCET.put(`ip:${ip}`, "1", { expirationTtl: 86400 });
        return json({ success: true, reward: REWARD, remaining: MAX_DAILY - user.claimsToday, message: "Claim sukses + payout terkirim" });
      } catch (e) { return json({ success: false, error: e.message }, 500); }
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};