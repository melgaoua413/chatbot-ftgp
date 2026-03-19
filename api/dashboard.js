const { createClient } = require("@supabase/supabase-js");
const PASSWORD = process.env.DASHBOARD_PASSWORD || "Iloveyoubaby75002";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  // ── POST : check password ──
  if (req.method === "POST") {
    var body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch(e) { body = {}; } }
    return res.status(body.password === PASSWORD ? 200 : 401).json({ ok: body.password === PASSWORD });
  }

  // ── GET ?json=1 : données ──
  if (req.query.json === "1") {
    var auth = req.headers["x-dashboard-password"] || "";
    if (auth !== PASSWORD) return res.status(401).json({ error: "Non autorisé" });
    try {
      var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      var total = await sb.from("chat_logs").select("*", { count: "exact", head: true });
      var since7  = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      var since30 = new Date(Date.now() - 30*24*60*60*1000).toISOString();
      var week  = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since7);
      var month = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since30);
      var byDayRaw = await sb.from("chat_logs").select("created_at").gte("created_at", since30);
      var dayCount = {};
      (byDayRaw.data||[]).forEach(function(r){ var d=r.created_at.split("T")[0]; dayCount[d]=(dayCount[d]||0)+1; });
      var qRaw = await sb.from("chat_logs").select("question,answer,created_at").order("created_at",{ascending:false}).limit(500);
      var keywords={}, topics={programmes:0,adhesion:0,evenements:0,equipe:0,partenaires:0,contact:0,hiit:0,trackia:0}, langs={fr:0,en:0}, totalLen=0;
      var stop=["le","la","les","de","du","des","un","une","est","que","qui","quoi","comment","je","tu","il","nous","vous","ils","et","ou","mais","donc","car","pas","plus","tres","bien","aussi","pour","avec","dans","sur","par","au","aux","en","ce","mon","ton","son","ma","ta","sa","me","te","se","si","ne","ni","ya","the","is","are","what","how","can","this","that","with","have","from","your","about","would","could","please","hello","bonjour","bonsoir","salut","merci","okay","cest","jai","suis","faire","avoir","etre","veux","want","need","know"];
      (qRaw.data||[]).forEach(function(r){
        if(r.answer) totalLen+=r.answer.length;
        if(!r.question) return;
        var q=r.question.toLowerCase();
        if(/programme|track|hiit|scaleup|tremplin|gen50|visa|next40|central|ville/.test(q)) topics.programmes++;
        if(/adh[eé]sion|member|tarif|prix|co[uû]t/.test(q)) topics.adhesion++;
        if(/[eé]v[eé]nement|event|agenda|prochain|date|quand/.test(q)) topics.evenements++;
        if(/[eé]quipe|team|alexandra|melissa|brandon|kristina|cl[eé]ment/.test(q)) topics.equipe++;
        if(/partenaire|partner/.test(q)) topics.partenaires++;
        if(/contact|joindre|[eé]crire|appeler|rdv/.test(q)) topics.contact++;
        if(/hiit|health|sant[eé]|medtech|healthtech/.test(q)) topics.hiit++;
        if(/track.ia|intelligence.artificielle|\bia\b|\bai\b/.test(q)) topics.trackia++;
        if(/bonjour|merci|salut|oui|non|programme|adhesion/.test(q)) langs.fr++; else langs.en++;
        q.split(/\s+/).forEach(function(w){
          w=w.replace(/[^a-zA-ZÀ-ÿ]/g,"");
          if(w.length>3&&!stop.includes(w)) keywords[w]=(keywords[w]||0)+1;
        });
      });
      var topKw=Object.entries(keywords).sort(function(a,b){return b[1]-a[1];}).slice(0,20);
      var recent=await sb.from("chat_logs").select("question,answer,created_at").order("created_at",{ascending:false}).limit(50);
      var avgLen=qRaw.data&&qRaw.data.length?Math.round(totalLen/qRaw.data.length):0;
      return res.status(200).json({total:total.count||0,week:week.count||0,month:month.count||0,byDay:dayCount,topKeywords:topKw,topics,langs,avgLen,recent:recent.data||[]});
    } catch(e){ return res.status(500).json({error:e.message}); }
  }

  // ── GET : HTML ──
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Dashboard FTGP</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4FF;color:#160B47;min-height:100vh}
#ls{position:fixed;inset:0;background:linear-gradient(135deg,#0045B3,#160B47);display:flex;align-items:center;justify-content:center;z-index:999}
.lb{background:#fff;border-radius:20px;padding:40px;width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.lb img{width:46px;margin-bottom:14px}.lb h2{font-size:18px;font-weight:700;margin-bottom:4px}.lb p{font-size:12px;color:#9BA8C0;margin-bottom:20px}
.lb input{width:100%;padding:11px 14px;border:1.5px solid #EEF2FF;border-radius:10px;font-size:14px;margin-bottom:8px;outline:none}
.lb input:focus{border-color:#0045B3}.lerr{color:#EF4444;font-size:12px;min-height:16px;margin-bottom:10px}
.lbtn{width:100%;padding:12px;background:linear-gradient(135deg,#0045B3,#160B47);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}
.hdr{background:linear-gradient(135deg,#0045B3,#160B47);padding:16px 28px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(0,69,179,.25)}
.hdr img{width:32px}.hdr h1{color:#fff;font-size:16px;font-weight:700}
.badge{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.8);border-radius:20px;padding:3px 10px;font-size:11px;margin-left:8px}
.upd{color:rgba(255,255,255,.5);font-size:11px;margin-left:auto}
.btn{background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.25);color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px}
.cnt{max-width:1100px;margin:0 auto;padding:24px 20px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}
.card{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 2px 12px rgba(22,11,71,.07)}
.card .lbl{font-size:10px;color:#9BA8C0;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.card .val{font-size:30px;font-weight:800;color:#0045B3;line-height:1}.card .sub{font-size:11px;color:#9BA8C0;margin-top:4px}
.g2{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-bottom:16px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px}
@media(max-width:800px){.g2,.g3{grid-template-columns:1fr}}
.box{background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(22,11,71,.07)}
.box h2{font-size:13px;font-weight:700;margin-bottom:14px}
.kw-item{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.kw-w{font-size:12px;font-weight:600;min-width:100px;text-transform:capitalize}
.bar-wrap{flex:1;background:#EEF2FF;border-radius:20px;height:6px}
.bar{background:linear-gradient(90deg,#0045B3,#6366F1);height:6px;border-radius:20px}
.kw-n{font-size:11px;color:#9BA8C0;min-width:20px;text-align:right;font-weight:600}
.dc{display:flex;align-items:flex-end;gap:4px;height:100px;margin-top:4px}
.dc-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%}
.dc-bw{flex:1;display:flex;align-items:flex-end;width:100%}
.dc-b{width:100%;background:linear-gradient(180deg,#0045B3,#6366F1);border-radius:3px 3px 0 0;min-height:2px}
.dc-l{font-size:9px;color:#C4CDD6}.dc-v{font-size:10px;color:#0045B3;font-weight:700}
.tp-item{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F0F4FF}
.tp-item:last-child{border:none}.tp-n{font-size:12px;font-weight:600}
.tp-bw{flex:1;margin:0 10px;background:#EEF2FF;border-radius:20px;height:5px}
.tp-b{background:linear-gradient(90deg,#6366F1,#0045B3);height:5px;border-radius:20px}
.tp-c{font-size:12px;font-weight:700;color:#0045B3;min-width:24px;text-align:right}
.lw{display:flex;gap:10px;margin-top:6px}
.lp{flex:1;border-radius:10px;padding:12px;text-align:center}
.lf{font-size:22px;margin-bottom:2px}.lv{font-size:20px;font-weight:800;color:#0045B3}
.ll{font-size:10px;color:#9BA8C0;margin-top:2px}
.hc{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(22,11,71,.07);overflow:hidden;cursor:pointer;transition:.2s}
.hc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(22,11,71,.14)}
.hp{padding:20px;display:flex;align-items:center;gap:14px}
.hi{width:48px;height:48px;background:linear-gradient(135deg,#0045B3,#6366F1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.hn h3{font-size:14px;font-weight:700;margin-bottom:3px}.hn p{font-size:11px;color:#9BA8C0}
.hbdg{background:#EEF2FF;color:#0045B3;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;display:inline-block;margin-top:4px}
.ha{margin-left:auto;font-size:18px;color:#9BA8C0;transition:.2s}.hc:hover .ha{color:#0045B3;transform:translateX(3px)}
#modal{display:none;position:fixed;inset:0;background:rgba(22,11,71,.55);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(3px)}
#modal.open{display:flex}
.mb{background:#fff;border-radius:18px;width:min(680px,95vw);max-height:78vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.mh{padding:18px 22px;border-bottom:1px solid #EEF2FF;display:flex;align-items:center;justify-content:space-between}
.mh h3{font-size:15px;font-weight:700}.mc{background:none;border:none;font-size:20px;color:#9BA8C0;cursor:pointer}
.mbody{overflow-y:auto;padding:18px 22px;flex:1}
.ci{border:1.5px solid #EEF2FF;border-radius:12px;padding:14px;margin-bottom:10px;transition:.2s}
.ci:hover{border-color:#0045B3;background:#F7F9FF}
.cq{font-size:13px;font-weight:700;margin-bottom:6px}.ca{font-size:12px;color:#6B7A9F;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cm{display:flex;margin-top:8px}.ct{font-size:10px;color:#C4CDD6}.ce{font-size:11px;color:#0045B3;font-weight:600;cursor:pointer;margin-left:auto}
.loading{text-align:center;padding:50px;color:#9BA8C0}
</style></head><body>
<div id="ls"><div class="lb">
  <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg"/>
  <h2>Dashboard FTGP</h2><p>Accès restreint — équipe FTGP</p>
  <input id="pi" type="password" placeholder="Mot de passe" onkeydown="if(event.key==='Enter')login()"/>
  <div class="lerr" id="pe"></div>
  <button class="lbtn" onclick="login()">Accéder →</button>
</div></div>
<div id="main" style="display:none">
  <div class="hdr">
    <img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg"/>
    <h1>Dashboard Chatbot FTGP</h1>
    <span class="badge">⟳ Auto 5min</span>
    <span class="upd" id="upd"></span>
    <button class="btn" onclick="load()">↻ Actualiser</button>
  </div>
  <div class="cnt"><div id="app"><div class="loading">⏳ Chargement...</div></div></div>
</div>
<div id="modal"><div class="mb">
  <div class="mh"><h3>💬 Historique des conversations</h3><button class="mc" onclick="closeM()">✕</button></div>
  <div class="mbody" id="mbody"></div>
</div></div>
<script>
var PWD="",REC=[];
function login(){
  var p=document.getElementById("pi").value;
  if(!p){document.getElementById("pe").textContent="Mot de passe requis.";return;}
  fetch("https://chatbot-ftgp.vercel.app/api/dashboard?json=1",{headers:{"x-dashboard-password":p}})
  .then(function(r){if(r.status===401){document.getElementById("pe").textContent="Incorrect ❌";return null;}return r.json();})
  .then(function(d){if(!d)return;PWD=p;document.getElementById("ls").style.display="none";document.getElementById("main").style.display="block";render(d);setInterval(load,300000);})
  .catch(function(){document.getElementById("pe").textContent="Erreur réseau.";});
}
function load(){
  fetch("https://chatbot-ftgp.vercel.app/api/dashboard?json=1",{headers:{"x-dashboard-password":PWD}})
  .then(function(r){return r.json();}).then(render).catch(console.error);
}
function ago(iso){var m=Math.floor((new Date()-new Date(iso))/60000);if(m<1)return"à l'instant";if(m<60)return m+"min";if(m<1440)return Math.floor(m/60)+"h";return Math.floor(m/1440)+"j";}
function fd(iso){var d=new Date(iso);return("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);}
function cl(s){return(s||"").replace(/[#*_\[\]\`]/g,"").replace(/https?:\/\/\S+/g,"[lien]").trim();}
function openM(){document.getElementById("modal").classList.add("open");var mb=document.getElementById("mbody");mb.innerHTML=REC.map(function(r,i){return'<div class="ci"><div class="cq">❓ '+r.question+'</div><div class="ca" id="ca'+i+'">'+cl(r.answer)+'</div><div class="cm"><span class="ct">'+new Date(r.created_at).toLocaleString("fr-FR")+'</span><span class="ce" onclick="ex('+i+')">Voir tout ▾</span></div></div>';}).join("");}
function ex(i){var e=document.getElementById("ca"+i);e.style.webkitLineClamp=e.style.webkitLineClamp==="unset"?"2":"unset";}
function closeM(){document.getElementById("modal").classList.remove("open");}
document.getElementById("modal").addEventListener("click",function(e){if(e.target===this)closeM();});
function render(d){
  document.getElementById("upd").textContent="Mis à jour "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  REC=d.recent||[];
  var days=Object.entries(d.byDay||{}).sort(function(a,b){return a[0]>b[0]?1:-1;}).slice(-14);
  var maxD=Math.max(1,...days.map(function(x){return x[1];}));
  var maxK=d.topKeywords&&d.topKeywords.length?d.topKeywords[0][1]:1;
  var today=new Date().toISOString().split("T")[0];
  var tp=d.topics||{};var maxT=Math.max(1,...Object.values(tp));
  var lg=d.langs||{fr:0,en:0};var tl=(lg.fr||0)+(lg.en||0)||1;
  var tpL={programmes:"🚀 Programmes",adhesion:"💳 Adhésion",evenements:"📅 Événements",equipe:"👤 Équipe",partenaires:"🤝 Partenaires",contact:"📬 Contact",hiit:"💊 HIIT",trackia:"🤖 Track IA"};
  document.getElementById("app").innerHTML=
    '<div class="cards">'+
      '<div class="card"><div class="lbl">Total</div><div class="val">'+(d.total||0)+'</div><div class="sub">conversations</div></div>'+
      '<div class="card"><div class="lbl">Ce mois</div><div class="val">'+(d.month||0)+'</div><div class="sub">30 derniers jours</div></div>'+
      '<div class="card"><div class="lbl">Cette semaine</div><div class="val">'+(d.week||0)+'</div><div class="sub">7 derniers jours</div></div>'+
      '<div class="card"><div class="lbl">Aujourd&#39;hui</div><div class="val">'+((d.byDay||{})[today]||0)+'</div><div class="sub">'+new Date().toLocaleDateString("fr-FR")+'</div></div>'+
      '<div class="card"><div class="lbl">Moy. réponse</div><div class="val">'+(d.avgLen||0)+'</div><div class="sub">caractères</div></div>'+
    '</div>'+
    '<div class="g2">'+
      '<div class="box"><h2>📅 Activité 14 derniers jours</h2><div class="dc">'+
        (days.length?days.map(function(e){var h=Math.max(2,Math.round((e[1]/maxD)*90));return'<div class="dc-col"><div class="dc-v">'+e[1]+'</div><div class="dc-bw"><div class="dc-b" style="height:'+h+'px"></div></div><div class="dc-l">'+fd(e[0])+'</div></div>';}).join(""):'<p style="color:#9BA8C0;font-size:12px">Pas de données</p>')+
      '</div></div>'+
      '<div class="box"><h2>🎯 Sujets demandés</h2>'+
        Object.entries(tpL).map(function(e){var v=tp[e[0]]||0;var p=Math.round((v/maxT)*100);return'<div class="tp-item"><span class="tp-n">'+e[1]+'</span><div class="tp-bw"><div class="tp-b" style="width:'+p+'%"></div></div><span class="tp-c">'+v+'</span></div>';}).join("")+
      '</div>'+
    '</div>'+
    '<div class="g3">'+
      '<div class="box" style="grid-column:span 2"><h2>🔥 Mots-clés fréquents</h2>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">'+
          (d.topKeywords||[]).slice(0,16).map(function(e){var p=Math.round((e[1]/maxK)*100);return'<div class="kw-item"><span class="kw-w">'+e[0]+'</span><div class="bar-wrap"><div class="bar" style="width:'+p+'%"></div></div><span class="kw-n">'+e[1]+'</span></div>';}).join("")+
        '</div></div>'+
      '<div class="box"><h2>🌍 Langues</h2>'+
        '<div class="lw">'+
          '<div class="lp" style="background:#F0F4FF"><div class="lf">🇫🇷</div><div class="lv">'+Math.round((lg.fr/tl)*100)+'%</div><div class="ll">Français ('+lg.fr+')</div></div>'+
          '<div class="lp" style="background:#F0F9FF"><div class="lf">🇬🇧</div><div class="lv">'+Math.round((lg.en/tl)*100)+'%</div><div class="ll">Anglais ('+lg.en+')</div></div>'+
        '</div></div>'+
    '</div>'+
    '<div class="hc" onclick="openM()">'+
      '<div class="hp"><div class="hi">💬</div><div class="hn"><h3>Historique des conversations</h3><p>'+REC.length+' dernières conversations</p><span class="hbdg">Cliquer pour voir →</span></div><div class="ha">›</div></div>'+
    '</div>';
}
</script></body></html>`);
};
