const { createClient } = require("@supabase/supabase-js");

const PASSWORD = process.env.DASHBOARD_PASSWORD || "Iloveyoubaby75002";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // Vérification mot de passe
  if (req.query.json === "1") {
    var pwd = req.headers["x-dashboard-password"] || "";
    if (pwd !== PASSWORD) return res.status(401).json({ error: "Non autorisé" });
  }

  // Retourne les données JSON si demandé
  if (req.query.json === "1") {
    try {
      var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      var total = await sb.from("chat_logs").select("*", { count: "exact", head: true });
      var since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      var week = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since);
      var byDayRaw = await sb.from("chat_logs").select("created_at").gte("created_at", since);
      var dayCount = {};
      if (byDayRaw.data) byDayRaw.data.forEach(function(r) { var d = r.created_at.split("T")[0]; dayCount[d] = (dayCount[d] || 0) + 1; });
      var qRaw = await sb.from("chat_logs").select("question,answer,created_at").order("created_at", { ascending: false }).limit(200);
      var keywords = {};
      var stop = ["le","la","les","de","du","des","un","une","est","que","qui","quoi","comment","je","tu","il","nous","vous","ils","et","ou","mais","donc","car","pas","plus","tres","bien","aussi","pour","avec","dans","sur","par","au","aux","en","ce","mon","ton","son","ma","ta","sa","me","te","se","si","ne","ni","ya"];
      if (qRaw.data) qRaw.data.forEach(function(r) {
        if (!r.question) return;
        r.question.toLowerCase().split(/\s+/).forEach(function(w) {
          w = w.replace(/[^a-zA-ZÀ-ÿ]/g, "");
          if (w.length > 3 && !stop.includes(w)) keywords[w] = (keywords[w] || 0) + 1;
        });
      });
      var topKw = Object.entries(keywords).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 15);
      var recent = await sb.from("chat_logs").select("question,answer,created_at").order("created_at", { ascending: false }).limit(10);
      return res.status(200).json({ total: total.count || 0, week: week.count || 0, byDay: dayCount, topKeywords: topKw, recent: recent.data || [] });
    } catch (e) {
      return res.status(500).json({ error: "Erreur serveur: " + e.message });
    }
  }

  // Retourne le HTML du dashboard
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Dashboard Chatbot FTGP</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F9FF;color:#160B47;min-height:100vh}
.header{background:linear-gradient(135deg,#0045B3,#160B47);padding:20px 32px;display:flex;align-items:center;gap:16px}
.header img{width:36px;height:36px}
.header h1{color:white;font-size:18px;font-weight:700}
.header span{color:rgba(255,255,255,.65);font-size:13px;margin-left:auto}
.btn{background:none;border:1.5px solid rgba(255,255,255,.4);color:white;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.btn:hover{background:rgba(255,255,255,.15)}
.container{max-width:1100px;margin:0 auto;padding:32px 24px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px}
.card{background:white;border-radius:16px;padding:20px 24px;box-shadow:0 2px 12px rgba(22,11,71,.08)}
.card .label{font-size:12px;color:#9BA8C0;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.card .value{font-size:32px;font-weight:700;color:#0045B3}
.card .sub{font-size:12px;color:#9BA8C0;margin-top:4px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
@media(max-width:700px){.grid2{grid-template-columns:1fr}}
.box{background:white;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(22,11,71,.08);margin-bottom:24px}
.box h2{font-size:15px;font-weight:700;color:#160B47;margin-bottom:16px}
.kw-item{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.kw-word{font-size:13px;font-weight:600;color:#160B47;min-width:120px}
.kw-bar-wrap{flex:1;background:#EEF2FF;border-radius:20px;height:8px}
.kw-bar{background:linear-gradient(90deg,#0045B3,#3B82F6);height:8px;border-radius:20px}
.kw-count{font-size:12px;color:#9BA8C0;min-width:24px;text-align:right}
.day-chart{display:flex;align-items:flex-end;gap:6px;height:120px;margin-top:8px}
.day-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}
.day-bar-wrap{flex:1;display:flex;align-items:flex-end;width:100%}
.day-bar{width:100%;background:linear-gradient(180deg,#0045B3,#3B82F6);border-radius:4px 4px 0 0;min-height:4px}
.day-label{font-size:10px;color:#9BA8C0}
.day-val{font-size:11px;color:#0045B3;font-weight:700}
.recent-item{padding:14px 0;border-bottom:1px solid #EEF2FF}
.recent-item:last-child{border-bottom:none}
.recent-q{font-size:13px;font-weight:600;color:#160B47;margin-bottom:4px}
.recent-a{font-size:12px;color:#6B7A9F;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.recent-time{font-size:11px;color:#9BA8C0;margin-top:4px}
.err{text-align:center;padding:60px;color:#EF4444;font-size:15px}
.loading{text-align:center;padding:60px;color:#9BA8C0;font-size:15px}
</style>
</head>
<body>
<div class="header">
  <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" alt="FTGP"/>
  <h1>Dashboard Chatbot FTGP</h1>
  <span id="upd">Chargement...</span>
  <button class="btn" onclick="load()">↻ Actualiser</button>
</div>
<div id="login-screen" style="display:flex;position:fixed;inset:0;background:linear-gradient(135deg,#0045B3,#160B47);align-items:center;justify-content:center;z-index:9999">
  <div style="background:white;border-radius:20px;padding:40px;width:340px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" style="width:48px;margin-bottom:16px"/>
    <h2 style="font-size:18px;font-weight:700;color:#160B47;margin-bottom:6px">Dashboard FTGP</h2>
    <p style="font-size:13px;color:#9BA8C0;margin-bottom:24px">Accès restreint — équipe FTGP</p>
    <input id="pwd-input" type="password" placeholder="Mot de passe" onkeydown="if(event.key==='Enter')login()" style="width:100%;padding:12px 16px;border:1.5px solid #EEF2FF;border-radius:10px;font-size:14px;color:#160B47;outline:none;margin-bottom:8px"/>
    <p id="pwd-err" style="color:#EF4444;font-size:12px;min-height:16px;margin-bottom:12px"></p>
    <button onclick="login()" style="width:100%;padding:12px;background:linear-gradient(135deg,#0045B3,#160B47);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Accéder →</button>
  </div>
</div>
<div class="container">
  <div id="app"></div>
</div>
<script>
function ago(iso){
  var d=new Date(iso),n=new Date(),m=Math.floor((n-d)/60000);
  if(m<1)return"à l'instant";if(m<60)return m+"min";
  if(m<1440)return Math.floor(m/60)+"h";return Math.floor(m/1440)+"j";
}
function fdate(iso){
  var d=new Date(iso);
  return("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);
}
var PWD = "";
function login(){
  var p = document.getElementById("pwd-input").value;
  if(!p){ document.getElementById("pwd-err").textContent="Mot de passe requis."; return; }
  PWD = p;
  document.getElementById("login-screen").style.display="none";
  document.getElementById("app").innerHTML='<div class="loading">⏳ Chargement des données...</div>';
  // Ne charge pas au démarrage — attend le login
}
function load(){
  document.getElementById("upd").textContent="Actualisation...";
  fetch("https://chatbot-ftgp.vercel.app/api/dashboard?json=1", { headers:{"x-dashboard-password": PWD} })
  .then(function(r){
    if(r.status===401){ document.getElementById("login-screen").style.display="flex"; document.getElementById("pwd-err").textContent="Mot de passe incorrect."; PWD=""; return Promise.reject("401"); }
    return r.json();
  })
  .then(function(d){
    document.getElementById("upd").textContent="Mis à jour à "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    var days=Object.entries(d.byDay||{}).sort(function(a,b){return a[0]>b[0]?1:-1;});
    var maxD=Math.max(1,...days.map(function(x){return x[1];}));
    var maxK=d.topKeywords&&d.topKeywords.length?d.topKeywords[0][1]:1;
    var today=new Date().toISOString().split("T")[0];
    var html=
      '<div class="cards">'+
        '<div class="card"><div class="label">Total conversations</div><div class="value">'+(d.total||0)+'</div><div class="sub">Depuis le début</div></div>'+
        '<div class="card"><div class="label">Cette semaine</div><div class="value">'+(d.week||0)+'</div><div class="sub">7 derniers jours</div></div>'+
        '<div class="card"><div class="label">Aujourd&#39;hui</div><div class="value">'+((d.byDay||{})[today]||0)+'</div><div class="sub">'+new Date().toLocaleDateString("fr-FR")+'</div></div>'+
        '<div class="card"><div class="label">Mots-clés uniques</div><div class="value">'+(d.topKeywords?d.topKeywords.length:0)+'</div><div class="sub">Sujets détectés</div></div>'+
      '</div>'+
      '<div class="grid2">'+
        '<div class="box"><h2>📅 Activité 7 derniers jours</h2><div class="day-chart">'+
          (days.length ? days.map(function(e){
            var h=Math.max(4,Math.round((e[1]/maxD)*100));
            return'<div class="day-col"><div class="day-val">'+e[1]+'</div><div class="day-bar-wrap"><div class="day-bar" style="height:'+h+'px"></div></div><div class="day-label">'+fdate(e[0])+'</div></div>';
          }).join("") : '<p style="color:#9BA8C0;font-size:13px">Aucune donnée</p>')+
        '</div></div>'+
        '<div class="box"><h2>🔥 Mots-clés fréquents</h2>'+
          (d.topKeywords||[]).slice(0,10).map(function(e){
            var p=Math.round((e[1]/maxK)*100);
            return'<div class="kw-item"><span class="kw-word">'+e[0]+'</span><div class="kw-bar-wrap"><div class="kw-bar" style="width:'+p+'%"></div></div><span class="kw-count">'+e[1]+'</span></div>';
          }).join("")+
        '</div>'+
      '</div>'+
      '<div class="box"><h2>💬 Dernières conversations</h2>'+
        (d.recent||[]).map(function(r){
          return'<div class="recent-item"><div class="recent-q">❓ '+r.question+'</div><div class="recent-a">🤖 '+r.answer.replace(/[#*_\[\]]/g,"")+'</div><div class="recent-time">'+ago(r.created_at)+'</div></div>';
        }).join("")+
      '</div>';
    document.getElementById("app").innerHTML=html;
  })
  .catch(function(e){
    document.getElementById("app").innerHTML='<div class="err">❌ Erreur de chargement : '+e.message+'</div>';
  });
}
load();
</script>
</body>
</html>`);
};
