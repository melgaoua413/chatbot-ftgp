const { createClient } = require("@supabase/supabase-js");

const PASSWORD = process.env.DASHBOARD_PASSWORD || "Iloveyoubaby75002";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  // ── POST : vérification mot de passe ──
  if (req.method === "POST") {
    var body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch(e) { body = {}; } }
    if (body.password === PASSWORD) return res.status(200).json({ ok: true });
    return res.status(401).json({ ok: false });
  }

  // ── GET ?json=1 : données Supabase ──
  if (req.query.json === "1") {
    var auth = req.headers["x-dashboard-password"] || "";
    if (auth !== PASSWORD) return res.status(401).json({ error: "Non autorisé" });
    try {
      var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      var total = await sb.from("chat_logs").select("*", { count: "exact", head: true });
      var since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      var since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      var week = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since7);
      var month = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since30);

      // Activité par jour (30 derniers jours)
      var byDayRaw = await sb.from("chat_logs").select("created_at").gte("created_at", since30);
      var dayCount = {};
      if (byDayRaw.data) byDayRaw.data.forEach(function(r) {
        var d = r.created_at.split("T")[0]; dayCount[d] = (dayCount[d] || 0) + 1;
      });

      // Analyse mots-clés intelligente
      var qRaw = await sb.from("chat_logs").select("question,answer,created_at,lang").order("created_at", { ascending: false }).limit(500);
      var keywords = {};
      var topics = { programmes: 0, adhesion: 0, evenements: 0, equipe: 0, partenaires: 0, contact: 0, hiit: 0, trackia: 0 };
      var langCount = { fr: 0, en: 0 };

      // Mots vides FR + EN enrichis
      var stop = ["le","la","les","de","du","des","un","une","est","que","qui","quoi","comment","je","tu","il","nous","vous","ils","et","ou","mais","donc","car","pas","plus","tres","bien","aussi","pour","avec","dans","sur","par","au","aux","en","ce","mon","ton","son","ma","ta","sa","me","te","se","si","ne","ni","ya","the","is","are","what","how","can","this","that","with","have","from","your","about","would","could","please","hello","bonjour","bonsoir","salut","merci","svp","stp","okay","cest","cest","jai","jai","suis","faire","avoir","etre","veux","want","need","know"];

      if (qRaw.data) qRaw.data.forEach(function(r) {
        // Comptage langues
        if (r.lang === "en") langCount.en++; else langCount.fr++;

        if (!r.question) return;
        var q = r.question.toLowerCase();

        // Détection topics
        if (/programme|program|track|hiit|scaleup|scale-up|tremplin|gen50|visa|next40|central|ville/.test(q)) topics.programmes++;
        if (/adh[eé]sion|member|cotis|tarif|prix|co[uû]t/.test(q)) topics.adhesion++;
        if (/[eé]v[eé]nement|event|agenda|prochain|date|quand/.test(q)) topics.evenements++;
        if (/[eé]quipe|team|alexandra|melissa|brandon|kristina|gaspard|cl[eé]ment|iriantsoa/.test(q)) topics.equipe++;
        if (/partenaire|partner/.test(q)) topics.partenaires++;
        if (/contact|joindre|[eé]crire|appeler|rendez-vous|rdv/.test(q)) topics.contact++;
        if (/hiit|health|sant[eé]|medtech|healthtech/.test(q)) topics.hiit++;
        if (/track.ia|intelligence artificielle|ia|ai|startup ia/.test(q)) topics.trackia++;

        // Mots-clés
        q.split(/\s+/).forEach(function(w) {
          w = w.replace(/[^a-zA-ZÀ-ÿ]/g, "");
          if (w.length > 3 && !stop.includes(w)) keywords[w] = (keywords[w] || 0) + 1;
        });
      });

      var topKw = Object.entries(keywords).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 20);
      var recent = await sb.from("chat_logs").select("question,answer,created_at").order("created_at", { ascending: false }).limit(50);

      // Satisfaction approx (likes vs dislikes si loggés, sinon ratio réponses courtes)
      var avgLen = 0;
      if (qRaw.data && qRaw.data.length) {
        qRaw.data.forEach(function(r) { if (r.answer) avgLen += r.answer.length; });
        avgLen = Math.round(avgLen / qRaw.data.length);
      }

      return res.status(200).json({
        total: total.count || 0,
        week: week.count || 0,
        month: month.count || 0,
        byDay: dayCount,
        topKeywords: topKw,
        topics: topics,
        langCount: langCount,
        avgLen: avgLen,
        recent: recent.data || []
      });
    } catch (e) {
      return res.status(500).json({ error: "Erreur: " + e.message });
    }
  }

  // ── GET : page HTML ──
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Dashboard Chatbot FTGP</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4FF;color:#160B47;min-height:100vh}
#login-screen{position:fixed;inset:0;background:linear-gradient(135deg,#0045B3,#160B47);display:flex;align-items:center;justify-content:center;z-index:9999}
.login-box{background:white;border-radius:24px;padding:44px;width:360px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.35)}
.login-box img{width:52px;margin-bottom:18px}
.login-box h2{font-size:20px;font-weight:700;color:#160B47;margin-bottom:6px}
.login-box .sub{font-size:13px;color:#9BA8C0;margin-bottom:28px}
.login-box input{width:100%;padding:13px 16px;border:1.5px solid #EEF2FF;border-radius:12px;font-size:14px;color:#160B47;outline:none;margin-bottom:10px;transition:.2s}
.login-box input:focus{border-color:#0045B3}
.login-err{color:#EF4444;font-size:12px;min-height:18px;margin-bottom:12px}
.login-btn{width:100%;padding:13px;background:linear-gradient(135deg,#0045B3,#160B47);color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:.2s}
.login-btn:hover{opacity:.9}
.header{background:linear-gradient(135deg,#0045B3,#160B47);padding:18px 32px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(0,69,179,.3)}
.header img{width:34px}
.header h1{color:white;font-size:17px;font-weight:700}
.header .upd{color:rgba(255,255,255,.55);font-size:12px;margin-left:auto}
.btn{background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.3);color:white;border-radius:10px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;transition:.2s;margin-left:10px}
.btn:hover{background:rgba(255,255,255,.22)}
.auto-badge{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.8);border-radius:20px;padding:4px 12px;font-size:11px;margin-left:8px}
.container{max-width:1140px;margin:0 auto;padding:28px 24px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:24px}
.card{background:white;border-radius:16px;padding:20px 22px;box-shadow:0 2px 16px rgba(22,11,71,.07);transition:.2s}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(22,11,71,.12)}
.card .label{font-size:11px;color:#9BA8C0;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}
.card .value{font-size:34px;font-weight:800;color:#0045B3;line-height:1}
.card .sub{font-size:12px;color:#9BA8C0;margin-top:6px}
.card .trend{font-size:11px;font-weight:600;margin-top:4px}
.up{color:#10B981}.down{color:#EF4444}
.grid2{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;margin-bottom:20px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px}
@media(max-width:900px){.grid2,.grid3{grid-template-columns:1fr}}
.box{background:white;border-radius:16px;padding:22px;box-shadow:0 2px 16px rgba(22,11,71,.07)}
.box h2{font-size:14px;font-weight:700;color:#160B47;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.kw-item{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.kw-word{font-size:12px;font-weight:600;color:#160B47;min-width:110px;text-transform:capitalize}
.kw-bar-wrap{flex:1;background:#EEF2FF;border-radius:20px;height:7px}
.kw-bar{background:linear-gradient(90deg,#0045B3,#6366F1);height:7px;border-radius:20px;transition:width .6s}
.kw-count{font-size:11px;color:#9BA8C0;min-width:22px;text-align:right;font-weight:600}
.day-chart{display:flex;align-items:flex-end;gap:5px;height:110px;margin-top:4px}
.day-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%}
.day-bar-wrap{flex:1;display:flex;align-items:flex-end;width:100%}
.day-bar{width:100%;background:linear-gradient(180deg,#0045B3,#6366F1);border-radius:3px 3px 0 0;min-height:3px;transition:height .5s}
.day-label{font-size:9px;color:#C4CDD6}
.day-val{font-size:10px;color:#0045B3;font-weight:700}
.topic-item{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0F4FF}
.topic-item:last-child{border:none}
.topic-name{font-size:13px;font-weight:600;color:#160B47}
.topic-bar-wrap{flex:1;margin:0 12px;background:#EEF2FF;border-radius:20px;height:6px}
.topic-bar{background:linear-gradient(90deg,#6366F1,#0045B3);height:6px;border-radius:20px}
.topic-count{font-size:12px;font-weight:700;color:#0045B3;min-width:28px;text-align:right}
.lang-wrap{display:flex;gap:12px;margin-top:8px}
.lang-pill{flex:1;border-radius:12px;padding:14px;text-align:center}
.lang-flag{font-size:24px;margin-bottom:4px}
.lang-pct{font-size:22px;font-weight:800;color:#0045B3}
.lang-lbl{font-size:11px;color:#9BA8C0;margin-top:2px}

/* HISTORIQUE CARD */
.history-card{background:white;border-radius:16px;box-shadow:0 2px 16px rgba(22,11,71,.07);overflow:hidden;cursor:pointer;transition:.2s;position:relative}
.history-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(22,11,71,.14)}
.history-preview{padding:22px;display:flex;align-items:center;gap:16px}
.history-icon{width:52px;height:52px;background:linear-gradient(135deg,#0045B3,#6366F1);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.history-info h3{font-size:15px;font-weight:700;color:#160B47;margin-bottom:4px}
.history-info p{font-size:12px;color:#9BA8C0}
.history-arrow{margin-left:auto;font-size:20px;color:#9BA8C0;transition:.2s}
.history-card:hover .history-arrow{color:#0045B3;transform:translateX(4px)}
.history-badge{background:#EEF2FF;color:#0045B3;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:6px}

/* MODAL HISTORIQUE */
#history-modal{display:none;position:fixed;inset:0;background:rgba(22,11,71,.6);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
#history-modal.open{display:flex}
.modal-box{background:white;border-radius:20px;width:min(700px,95vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.3)}
.modal-header{padding:20px 24px;border-bottom:1px solid #EEF2FF;display:flex;align-items:center;justify-content:space-between}
.modal-header h3{font-size:16px;font-weight:700;color:#160B47}
.modal-close{background:none;border:none;font-size:22px;color:#9BA8C0;cursor:pointer;line-height:1}
.modal-close:hover{color:#160B47}
.modal-body{overflow-y:auto;padding:20px 24px;flex:1}
.conv-item{border:1.5px solid #EEF2FF;border-radius:14px;padding:16px;margin-bottom:12px;transition:.2s}
.conv-item:hover{border-color:#0045B3;background:#F7F9FF}
.conv-q{font-size:13px;font-weight:700;color:#160B47;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px}
.conv-a{font-size:12px;color:#6B7A9F;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.conv-meta{display:flex;align-items:center;gap:8px;margin-top:10px}
.conv-time{font-size:11px;color:#C4CDD6}
.conv-expand{font-size:11px;color:#0045B3;font-weight:600;cursor:pointer;margin-left:auto}
.loading{text-align:center;padding:60px;color:#9BA8C0;font-size:15px}
.err{text-align:center;padding:40px;color:#EF4444}
</style>
</head>
<body>

<div id="login-screen">
  <div class="login-box">
    <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" alt="FTGP"/>
    <h2>Dashboard FTGP</h2>
    <p class="sub">Accès restreint — équipe FTGP</p>
    <input id="pwd-input" type="password" placeholder="Mot de passe" onkeydown="if(event.key==='Enter')login()"/>
    <div class="login-err" id="pwd-err"></div>
    <button class="login-btn" onclick="login()">Accéder →</button>
  </div>
</div>

<div id="main" style="display:none">
  <div class="header">
    <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" alt="FTGP"/>
    <h1>Dashboard Chatbot FTGP</h1>
    <span class="auto-badge">⟳ Auto-refresh 5min</span>
    <span class="upd" id="upd"></span>
    <button class="btn" onclick="load()">↻ Actualiser</button>
  </div>

  <div class="container">
    <div id="app"><div class="loading">⏳ Chargement des données...</div></div>
  </div>
</div>

<!-- Modal historique -->
<div id="history-modal">
  <div class="modal-box">
    <div class="modal-header">
      <h3>💬 Historique des conversations</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<script>
var PWD = "";
var autoRefresh = null;

function login(){
  var p = document.getElementById("pwd-input").value;
  if(!p){ document.getElementById("pwd-err").textContent="Mot de passe requis."; return; }
  fetch("/api/dashboard?json=1", { headers:{"x-dashboard-password": p} })
  .then(function(r){
    if(r.status===401){ document.getElementById("pwd-err").textContent="Mot de passe incorrect ❌"; return null; }
    return r.json();
  })
  .then(function(d){
    if(!d) return;
    PWD = p;
    document.getElementById("login-screen").style.display="none";
    document.getElementById("main").style.display="block";
    render(d);
    // Auto-refresh toutes les 5 minutes
    autoRefresh = setInterval(load, 5 * 60 * 1000);
  })
  .catch(function(){ document.getElementById("pwd-err").textContent="Erreur réseau."; });
}

function load(){
  fetch("/api/dashboard?json=1", { headers:{"x-dashboard-password": PWD} })
  .then(function(r){ return r.json(); })
  .then(function(d){ render(d); })
  .catch(function(e){ console.error(e); });
}

function ago(iso){
  var m=Math.floor((new Date()-new Date(iso))/60000);
  if(m<1)return"à l'instant";if(m<60)return m+"min";
  if(m<1440)return Math.floor(m/60)+"h";return Math.floor(m/1440)+"j";
}
function fdate(iso){ var d=new Date(iso); return("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2); }
function clean(s){ return (s||"").replace(/[#*_\[\]`]/g,"").replace(/https?:\/\/\S+/g,"[lien]").trim(); }

function openModal(recent){
  var mb = document.getElementById("modal-body");
  mb.innerHTML = (recent||[]).map(function(r, i){
    return '<div class="conv-item">'+
      '<div class="conv-q"><span>❓</span><span>'+r.question+'</span></div>'+
      '<div class="conv-a" id="ca-'+i+'">'+clean(r.answer)+'</div>'+
      '<div class="conv-meta"><span class="conv-time">'+new Date(r.created_at).toLocaleString("fr-FR")+'</span>'+
      '<span class="conv-expand" onclick="expand('+i+')">Voir tout ▾</span></div>'+
    '</div>';
  }).join("");
  document.getElementById("history-modal").classList.add("open");
}
function expand(i){
  var el = document.getElementById("ca-"+i);
  el.style.webkitLineClamp = el.style.webkitLineClamp === "unset" ? "3" : "unset";
}
function closeModal(){ document.getElementById("history-modal").classList.remove("open"); }
document.getElementById("history-modal").addEventListener("click", function(e){ if(e.target===this) closeModal(); });

function render(d){
  document.getElementById("upd").textContent = "Mis à jour à "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});

  var days = Object.entries(d.byDay||{}).sort(function(a,b){return a[0]>b[0]?1:-1;}).slice(-14);
  var maxD = Math.max(1,...days.map(function(x){return x[1];}));
  var maxK = d.topKeywords&&d.topKeywords.length ? d.topKeywords[0][1] : 1;
  var today = new Date().toISOString().split("T")[0];
  var todayCount = (d.byDay||{})[today] || 0;
  var topics = d.topics || {};
  var maxT = Math.max(1, ...Object.values(topics));
  var langs = d.langCount || {fr:0,en:0};
  var totalLang = (langs.fr||0) + (langs.en||0) || 1;
  var topicLabels = {programmes:"🚀 Programmes", adhesion:"💳 Adhésion", evenements:"📅 Événements", equipe:"👤 Équipe", partenaires:"🤝 Partenaires", contact:"📬 Contact", hiit:"💊 HIIT", trackia:"🤖 Track IA"};

  var html =
    // KPIs
    '<div class="cards">'+
      '<div class="card"><div class="label">Total conversations</div><div class="value">'+(d.total||0)+'</div><div class="sub">Depuis le lancement</div></div>'+
      '<div class="card"><div class="label">Ce mois</div><div class="value">'+(d.month||0)+'</div><div class="sub">30 derniers jours</div></div>'+
      '<div class="card"><div class="label">Cette semaine</div><div class="value">'+(d.week||0)+'</div><div class="sub">7 derniers jours</div></div>'+
      '<div class="card"><div class="label">Aujourd&#39;hui</div><div class="value">'+todayCount+'</div><div class="sub">'+new Date().toLocaleDateString("fr-FR")+'</div></div>'+
      '<div class="card"><div class="label">Longueur moy. réponse</div><div class="value">'+(d.avgLen||0)+'</div><div class="sub">caractères / réponse</div></div>'+
    '</div>'+

    // Activité + Topics
    '<div class="grid2">'+
      '<div class="box"><h2>📅 Activité (14 derniers jours)</h2><div class="day-chart">'+
        (days.length ? days.map(function(e){
          var h = Math.max(3, Math.round((e[1]/maxD)*100));
          return '<div class="day-col"><div class="day-val">'+e[1]+'</div><div class="day-bar-wrap"><div class="day-bar" style="height:'+h+'px"></div></div><div class="day-label">'+fdate(e[0])+'</div></div>';
        }).join("") : '<p style="color:#9BA8C0;font-size:13px">Aucune donnée</p>')+
      '</div></div>'+
      '<div class="box"><h2>🎯 Sujets les plus demandés</h2>'+
        Object.entries(topicLabels).map(function(e){
          var v = topics[e[0]]||0;
          var p = Math.round((v/maxT)*100);
          return '<div class="topic-item"><span class="topic-name">'+e[1]+'</span><div class="topic-bar-wrap"><div class="topic-bar" style="width:'+p+'%"></div></div><span class="topic-count">'+v+'</span></div>';
        }).join("")+
      '</div>'+
    '</div>'+

    // Mots-clés + Langues
    '<div class="grid3">'+
      '<div class="box" style="grid-column:span 2"><h2>🔥 Mots-clés fréquents</h2>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px">'+
          (d.topKeywords||[]).slice(0,16).map(function(e){
            var p = Math.round((e[1]/maxK)*100);
            return '<div class="kw-item"><span class="kw-word">'+e[0]+'</span><div class="kw-bar-wrap"><div class="kw-bar" style="width:'+p+'%"></div></div><span class="kw-count">'+e[1]+'</span></div>';
          }).join("")+
        '</div>'+
      '</div>'+
      '<div class="box"><h2>🌍 Langues</h2>'+
        '<div class="lang-wrap">'+
          '<div class="lang-pill" style="background:#F0F4FF"><div class="lang-flag">🇫🇷</div><div class="lang-pct">'+Math.round((langs.fr/totalLang)*100)+'%</div><div class="lang-lbl">Français ('+langs.fr+')</div></div>'+
          '<div class="lang-pill" style="background:#F0F9FF"><div class="lang-flag">🇬🇧</div><div class="lang-pct">'+Math.round((langs.en/totalLang)*100)+'%</div><div class="lang-lbl">Anglais ('+langs.en+')</div></div>'+
        '</div>'+
        '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #EEF2FF">'+
          '<div style="font-size:11px;color:#9BA8C0;font-weight:700;text-transform:uppercase;margin-bottom:8px">Infos utiles</div>'+
          '<div style="font-size:13px;color:#6B7A9F;line-height:1.8">'+
            '📊 '+((d.total||0) > 0 ? Math.round((d.week||0)/(d.total||1)*100)+'% des convs cette semaine' : 'Pas encore de données')+'<br/>'+
            '⏱️ Auto-refresh toutes les 5min'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+

    // Historique card compacte
    '<div class="history-card" onclick="openModal('+JSON.stringify(d.recent||[]).replace(/</g,"\\u003c").replace(/>/g,"\\u003e")+')" >'+
      '<div class="history-preview">'+
        '<div class="history-icon">💬</div>'+
        '<div class="history-info">'+
          '<h3>Historique des conversations</h3>'+
          '<p>Dernières '+(d.recent||[]).length+' conversations enregistrées</p>'+
          '<span class="history-badge">Cliquer pour voir →</span>'+
        '</div>'+
        '<div class="history-arrow">›</div>'+
      '</div>'+
    '</div>';

  document.getElementById("app").innerHTML = html;
}
</script>
</body>
</html>`);
};
