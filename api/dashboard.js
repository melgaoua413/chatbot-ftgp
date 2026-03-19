const { createClient } = require("@supabase/supabase-js");
const PASSWORD = process.env.DASHBOARD_PASSWORD || "Iloveyoubaby75002";

function hasWord(str, word) { return str.indexOf(word) > -1; }

function cleanText(s) {
  if (!s) return "";
  var out = "";
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    var ok = (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 192 && c <= 255) || c === 32;
    if (ok) out += s[i];
    else out += " ";
  }
  return out;
}

function getWords(str) {
  return cleanText(str).split(" ").filter(function(w) { return w.length > 0; });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");

  if (req.method === "POST") {
    var body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch(e) { body = {}; } }
    return res.status(body.password === PASSWORD ? 200 : 401).json({ ok: body.password === PASSWORD });
  }

  if (req.query.json === "1") {
    var auth = req.headers["x-dashboard-password"] || "";
    if (auth !== PASSWORD) return res.status(401).json({ error: "Non autorise" });
    try {
      var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      var total = await sb.from("chat_logs").select("*", { count: "exact", head: true });
      var since7  = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      var since30 = new Date(Date.now() - 30*24*60*60*1000).toISOString();
      var week  = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since7);
      var month = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since30);
      var byDayRaw = await sb.from("chat_logs").select("created_at").gte("created_at", since30);
      var dayCount = {};
      (byDayRaw.data || []).forEach(function(r) {
        var d = r.created_at.split("T")[0];
        dayCount[d] = (dayCount[d] || 0) + 1;
      });

      var qRaw = await sb.from("chat_logs").select("question,answer,created_at").order("created_at", { ascending: false }).limit(500);
      var keywords = {};
      var topics = { programmes: 0, adhesion: 0, evenements: 0, equipe: 0, partenaires: 0, contact: 0, hiit: 0, trackia: 0 };
      var langs = { fr: 0, en: 0 };
      var totalLen = 0;
      var stop = ["le","la","les","de","du","des","un","une","est","que","qui","quoi","comment","je","tu","il","nous","vous","ils","et","ou","mais","donc","car","pas","plus","tres","bien","aussi","pour","avec","dans","sur","par","au","aux","en","ce","mon","ton","son","ma","ta","sa","me","te","se","si","ne","ni","ya","the","is","are","what","how","can","this","that","with","have","from","your","about","would","could","please","hello","bonjour","bonsoir","salut","merci","okay","cest","jai","suis","faire","avoir","etre","veux","want","need","know","cela","cette","tout","tous","tres"];

      (qRaw.data || []).forEach(function(r) {
        if (r.answer) totalLen += r.answer.length;
        if (!r.question) return;
        var q = r.question.toLowerCase();

        if (hasWord(q,"programme")||hasWord(q,"track")||hasWord(q,"hiit")||hasWord(q,"scaleup")||hasWord(q,"tremplin")||hasWord(q,"gen50")||hasWord(q,"visa")||hasWord(q,"next40")||hasWord(q,"central")||hasWord(q,"ville")) topics.programmes++;
        if (hasWord(q,"adhesion")||hasWord(q,"adh")||hasWord(q,"member")||hasWord(q,"tarif")||hasWord(q,"prix")||hasWord(q,"cout")) topics.adhesion++;
        if (hasWord(q,"evenement")||hasWord(q,"event")||hasWord(q,"agenda")||hasWord(q,"prochain")||hasWord(q,"quand")||hasWord(q,"date")) topics.evenements++;
        if (hasWord(q,"equipe")||hasWord(q,"team")||hasWord(q,"alexandra")||hasWord(q,"melissa")||hasWord(q,"brandon")||hasWord(q,"kristina")||hasWord(q,"clement")) topics.equipe++;
        if (hasWord(q,"partenaire")||hasWord(q,"partner")) topics.partenaires++;
        if (hasWord(q,"contact")||hasWord(q,"joindre")||hasWord(q,"ecrire")||hasWord(q,"appeler")||hasWord(q,"rdv")) topics.contact++;
        if (hasWord(q,"hiit")||hasWord(q,"health")||hasWord(q,"sante")||hasWord(q,"medtech")||hasWord(q,"healthtech")) topics.hiit++;
        if (hasWord(q,"track ia")||hasWord(q,"trackia")||hasWord(q,"artificielle")||hasWord(q," ia ")||hasWord(q," ai ")) topics.trackia++;
        if (hasWord(q,"bonjour")||hasWord(q,"merci")||hasWord(q,"salut")||hasWord(q,"oui")||hasWord(q,"non")||hasWord(q,"programme")) langs.fr++; else langs.en++;

        getWords(q).forEach(function(w) {
          var wl = w.toLowerCase();
          if (wl.length > 3 && stop.indexOf(wl) === -1) {
            keywords[wl] = (keywords[wl] || 0) + 1;
          }
        });
      });

      var topKw = Object.entries(keywords).sort(function(a,b){ return b[1]-a[1]; }).slice(0,20);
      var recent = await sb.from("chat_logs").select("question,answer,created_at").order("created_at", { ascending: false }).limit(50);
      var avgLen = qRaw.data && qRaw.data.length ? Math.round(totalLen / qRaw.data.length) : 0;

      return res.status(200).json({
        total: total.count || 0,
        week: week.count || 0,
        month: month.count || 0,
        byDay: dayCount,
        topKeywords: topKw,
        topics: topics,
        langs: langs,
        avgLen: avgLen,
        recent: recent.data || []
      });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.setHeader("Content-Type","text/html; charset=utf-8");
  var html = "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><title>Dashboard FTGP</title>";
  html += "<style>";
  html += "*{margin:0;padding:0;box-sizing:border-box}";
  html += "body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#F0F4FF;color:#160B47;min-height:100vh}";
  html += "#ls{position:fixed;inset:0;background:linear-gradient(135deg,#0045B3,#160B47);display:flex;align-items:center;justify-content:center;z-index:999}";
  html += ".lb{background:#fff;border-radius:20px;padding:40px;width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}";
  html += ".lb img{width:46px;margin-bottom:14px}";
  html += ".lb h2{font-size:18px;font-weight:700;margin-bottom:4px}";
  html += ".lb p{font-size:12px;color:#9BA8C0;margin-bottom:20px}";
  html += ".lb input{width:100%;padding:11px 14px;border:1.5px solid #EEF2FF;border-radius:10px;font-size:14px;margin-bottom:8px;outline:none}";
  html += ".lb input:focus{border-color:#0045B3}";
  html += ".lerr{color:#EF4444;font-size:12px;min-height:16px;margin-bottom:10px}";
  html += ".lbtn{width:100%;padding:12px;background:linear-gradient(135deg,#0045B3,#160B47);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}";
  html += ".hdr{background:linear-gradient(135deg,#0045B3,#160B47);padding:16px 28px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100}";
  html += ".hdr img{width:32px}";
  html += ".hdr h1{color:#fff;font-size:16px;font-weight:700}";
  html += ".badge{background:rgba(255,255,255,.15);color:rgba(255,255,255,.8);border-radius:20px;padding:3px 10px;font-size:11px;margin-left:8px}";
  html += ".upd{color:rgba(255,255,255,.5);font-size:11px;margin-left:auto}";
  html += ".rbtn{background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.25);color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;margin-left:8px}";
  html += ".cnt{max-width:1100px;margin:0 auto;padding:24px 20px}";
  html += ".cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}";
  html += ".card{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 2px 12px rgba(22,11,71,.07)}";
  html += ".card .lbl{font-size:10px;color:#9BA8C0;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}";
  html += ".card .val{font-size:30px;font-weight:800;color:#0045B3;line-height:1}";
  html += ".card .sub{font-size:11px;color:#9BA8C0;margin-top:4px}";
  html += ".g2{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-bottom:16px}";
  html += ".g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px}";
  html += "@media(max-width:800px){.g2,.g3{grid-template-columns:1fr}}";
  html += ".box{background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(22,11,71,.07)}";
  html += ".box h2{font-size:13px;font-weight:700;margin-bottom:14px}";
  html += ".kw-item{display:flex;align-items:center;gap:8px;margin-bottom:8px}";
  html += ".kw-w{font-size:12px;font-weight:600;min-width:100px;text-transform:capitalize}";
  html += ".bw{flex:1;background:#EEF2FF;border-radius:20px;height:6px}";
  html += ".br{background:linear-gradient(90deg,#0045B3,#6366F1);height:6px;border-radius:20px}";
  html += ".kw-n{font-size:11px;color:#9BA8C0;min-width:20px;text-align:right;font-weight:600}";
  html += ".dc{display:flex;align-items:flex-end;gap:4px;height:100px;margin-top:4px}";
  html += ".dc-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%}";
  html += ".dc-bw{flex:1;display:flex;align-items:flex-end;width:100%}";
  html += ".dc-b{width:100%;background:linear-gradient(180deg,#0045B3,#6366F1);border-radius:3px 3px 0 0;min-height:2px}";
  html += ".dc-l{font-size:9px;color:#C4CDD6}";
  html += ".dc-v{font-size:10px;color:#0045B3;font-weight:700}";
  html += ".tp-item{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F0F4FF}";
  html += ".tp-item:last-child{border:none}";
  html += ".tp-n{font-size:12px;font-weight:600}";
  html += ".tp-bw{flex:1;margin:0 10px;background:#EEF2FF;border-radius:20px;height:5px}";
  html += ".tp-b{background:linear-gradient(90deg,#6366F1,#0045B3);height:5px;border-radius:20px}";
  html += ".tp-c{font-size:12px;font-weight:700;color:#0045B3;min-width:24px;text-align:right}";
  html += ".lw{display:flex;gap:10px;margin-top:6px}";
  html += ".lp{flex:1;border-radius:10px;padding:12px;text-align:center}";
  html += ".lf{font-size:22px;margin-bottom:2px}";
  html += ".lv{font-size:20px;font-weight:800;color:#0045B3}";
  html += ".ll{font-size:10px;color:#9BA8C0;margin-top:2px}";
  html += ".hc{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(22,11,71,.07);overflow:hidden;cursor:pointer;transition:.2s}";
  html += ".hc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(22,11,71,.14)}";
  html += ".hp{padding:20px;display:flex;align-items:center;gap:14px}";
  html += ".hi{width:48px;height:48px;background:linear-gradient(135deg,#0045B3,#6366F1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}";
  html += ".hn h3{font-size:14px;font-weight:700;margin-bottom:3px}";
  html += ".hn p{font-size:11px;color:#9BA8C0}";
  html += ".hbdg{background:#EEF2FF;color:#0045B3;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;display:inline-block;margin-top:4px}";
  html += ".ha{margin-left:auto;font-size:18px;color:#9BA8C0}";
  html += "#modal{display:none;position:fixed;inset:0;background:rgba(22,11,71,.55);z-index:1000;align-items:center;justify-content:center}";
  html += "#modal.open{display:flex}";
  html += ".mb{background:#fff;border-radius:18px;width:min(680px,95vw);max-height:78vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25)}";
  html += ".mh{padding:18px 22px;border-bottom:1px solid #EEF2FF;display:flex;align-items:center;justify-content:space-between}";
  html += ".mh h3{font-size:15px;font-weight:700}";
  html += ".mc{background:none;border:none;font-size:20px;color:#9BA8C0;cursor:pointer}";
  html += ".mbody{overflow-y:auto;padding:18px 22px;flex:1}";
  html += ".ci{border:1.5px solid #EEF2FF;border-radius:12px;padding:14px;margin-bottom:10px}";
  html += ".cq{font-size:13px;font-weight:700;margin-bottom:6px}";
  html += ".ca{font-size:12px;color:#6B7A9F;line-height:1.5;overflow:hidden;max-height:60px}";
  html += ".ca.open{max-height:none}";
  html += ".cm{display:flex;margin-top:8px}";
  html += ".ct{font-size:10px;color:#C4CDD6}";
  html += ".ce{font-size:11px;color:#0045B3;font-weight:600;cursor:pointer;margin-left:auto}";
  html += ".loading{text-align:center;padding:50px;color:#9BA8C0}";
  html += "</style></head><body>";

  html += "<div id='ls'><div class='lb'>";
  html += "<img src='https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg'/>";
  html += "<h2>Dashboard FTGP</h2><p>Acces restreint - equipe FTGP</p>";
  html += "<input id='pi' type='password' placeholder='Mot de passe'/>";
  html += "<div class='lerr' id='pe'></div>";
  html += "<button class='lbtn' id='lbtn'>Acceder</button>";
  html += "</div></div>";

  html += "<div id='main' style='display:none'>";
  html += "<div class='hdr'><img src='https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg'/>";
  html += "<h1>Dashboard Chatbot FTGP</h1><span class='badge'>Auto 5min</span>";
  html += "<span class='upd' id='upd'></span><button class='rbtn' id='rbtn'>Actualiser</button></div>";
  html += "<div class='cnt'><div id='app'><div class='loading'>Chargement...</div></div></div>";
  html += "</div>";

  html += "<div id='modal'><div class='mb'>";
  html += "<div class='mh'><h3>Historique des conversations</h3><button class='mc' id='mc'>X</button></div>";
  html += "<div class='mbody' id='mbody'></div>";
  html += "</div></div>";

  html += "<script>";
  html += "var PWD='',REC=[];";
  html += "var API='https://chatbot-ftgp.vercel.app/api/dashboard?json=1';";

  html += "function doLogin(){";
  html += "  var p=document.getElementById('pi').value;";
  html += "  if(!p){document.getElementById('pe').textContent='Mot de passe requis.';return;}";
  html += "  fetch(API,{headers:{'x-dashboard-password':p}})";
  html += "  .then(function(r){";
  html += "    if(r.status===401){document.getElementById('pe').textContent='Incorrect';return null;}";
  html += "    return r.json();";
  html += "  })";
  html += "  .then(function(d){";
  html += "    if(!d)return;";
  html += "    PWD=p;";
  html += "    document.getElementById('ls').style.display='none';";
  html += "    document.getElementById('main').style.display='block';";
  html += "    render(d);";
  html += "    setInterval(doLoad,300000);";
  html += "  })";
  html += "  .catch(function(){document.getElementById('pe').textContent='Erreur reseau.';});";
  html += "}";

  html += "function doLoad(){";
  html += "  fetch(API,{headers:{'x-dashboard-password':PWD}})";
  html += "  .then(function(r){return r.json();})";
  html += "  .then(render).catch(console.error);";
  html += "}";

  html += "function ago(iso){var m=Math.floor((new Date()-new Date(iso))/60000);if(m<1)return\"a l'instant\";if(m<60)return m+'min';if(m<1440)return Math.floor(m/60)+'h';return Math.floor(m/1440)+'j';}";
  html += "function fd(iso){var d=new Date(iso);return('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2);}";

  html += "function openM(){";
  html += "  document.getElementById('modal').classList.add('open');";
  html += "  var mb=document.getElementById('mbody');";
  html += "  var out='';";
  html += "  for(var i=0;i<REC.length;i++){";
  html += "    var r=REC[i];";
  html += "    out+=\"<div class='ci'>\";";
  html += "    out+=\"<div class='cq'>\" + r.question + \"</div>\";";
  html += "    out+=\"<div class='ca' id='ca\"+i+\"'>\" + (r.answer||'').substring(0,300) + \"</div>\";";
  html += "    out+=\"<div class='cm'><span class='ct'>\"+new Date(r.created_at).toLocaleString('fr-FR')+\"</span>\";";
  html += "    out+=\"<span class='ce' data-i='\"+i+\"'>Voir tout</span></div></div>\";";
  html += "  }";
  html += "  mb.innerHTML=out;";
  html += "  mb.addEventListener('click',function(e){if(e.target.dataset.i!==undefined){var el=document.getElementById('ca'+e.target.dataset.i);el.classList.toggle('open');}});";
  html += "}";

  html += "function closeM(){document.getElementById('modal').classList.remove('open');}";

  html += "function render(d){";
  html += "  document.getElementById('upd').textContent='Mis a jour '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});";
  html += "  REC=d.recent||[];";
  html += "  var days=Object.entries(d.byDay||{}).sort(function(a,b){return a[0]>b[0]?1:-1;}).slice(-14);";
  html += "  var maxD=1; for(var i=0;i<days.length;i++){if(days[i][1]>maxD)maxD=days[i][1];}";
  html += "  var maxK=d.topKeywords&&d.topKeywords.length?d.topKeywords[0][1]:1;";
  html += "  var today=new Date().toISOString().split('T')[0];";
  html += "  var tp=d.topics||{};";
  html += "  var maxT=1;var tpv=Object.values(tp);for(var i=0;i<tpv.length;i++){if(tpv[i]>maxT)maxT=tpv[i];}";
  html += "  var lg=d.langs||{fr:0,en:0};var tl=(lg.fr||0)+(lg.en||0)||1;";
  html += "  var tpL=[['programmes','Programmes'],['adhesion','Adhesion'],['evenements','Evenements'],['equipe','Equipe'],['partenaires','Partenaires'],['contact','Contact'],['hiit','HIIT'],['trackia','Track IA']];";
  html += "  var out='';";
  html += "  out+=\"<div class='cards'>\";";
  html += "  out+=\"<div class='card'><div class='lbl'>Total</div><div class='val'>\"+(d.total||0)+\"</div><div class='sub'>conversations</div></div>\";";
  html += "  out+=\"<div class='card'><div class='lbl'>Ce mois</div><div class='val'>\"+(d.month||0)+\"</div><div class='sub'>30 derniers jours</div></div>\";";
  html += "  out+=\"<div class='card'><div class='lbl'>Semaine</div><div class='val'>\"+(d.week||0)+\"</div><div class='sub'>7 derniers jours</div></div>\";";
  html += "  out+=\"<div class='card'><div class='lbl'>Aujourd hui</div><div class='val'>\"+ ((d.byDay||{})[today]||0) +\"</div><div class='sub'>\"+new Date().toLocaleDateString('fr-FR')+\"</div></div>\";";
  html += "  out+=\"<div class='card'><div class='lbl'>Moy. reponse</div><div class='val'>\"+(d.avgLen||0)+\"</div><div class='sub'>caracteres</div></div>\";";
  html += "  out+=\"</div>\";";
  html += "  out+=\"<div class='g2'>\";";
  html += "  out+=\"<div class='box'><h2>Activite 14 jours</h2><div class='dc'>\";";
  html += "  for(var i=0;i<days.length;i++){var h=Math.max(2,Math.round((days[i][1]/maxD)*90));out+=\"<div class='dc-col'><div class='dc-v'>\"+days[i][1]+\"</div><div class='dc-bw'><div class='dc-b' style='height:\"+h+\"px'></div></div><div class='dc-l'>\"+fd(days[i][0])+\"</div></div>\";}";
  html += "  out+=\"</div></div>\";";
  html += "  out+=\"<div class='box'><h2>Sujets demandes</h2>\";";
  html += "  for(var i=0;i<tpL.length;i++){var v=tp[tpL[i][0]]||0;var p=Math.round((v/maxT)*100);out+=\"<div class='tp-item'><span class='tp-n'>\"+tpL[i][1]+\"</span><div class='tp-bw'><div class='tp-b' style='width:\"+p+\"%'></div></div><span class='tp-c'>\"+v+\"</span></div>\";}";
  html += "  out+=\"</div></div>\";";
  html += "  out+=\"<div class='g3'>\";";
  html += "  out+=\"<div class='box' style='grid-column:span 2'><h2>Mots-cles frequents</h2><div style='display:grid;grid-template-columns:1fr 1fr;gap:0 20px'>\";";
  html += "  var kws=d.topKeywords||[];for(var i=0;i<Math.min(kws.length,16);i++){var pp=Math.round((kws[i][1]/maxK)*100);out+=\"<div class='kw-item'><span class='kw-w'>\"+kws[i][0]+\"</span><div class='bw'><div class='br' style='width:\"+pp+\"%'></div></div><span class='kw-n'>\"+kws[i][1]+\"</span></div>\";}";
  html += "  out+=\"</div></div>\";";
  html += "  out+=\"<div class='box'><h2>Langues</h2><div class='lw'>\";";
  html += "  out+=\"<div class='lp' style='background:#F0F4FF'><div class='lf'>FR</div><div class='lv'>\"+Math.round((lg.fr/tl)*100)+\"%</div><div class='ll'>Francais (\"+lg.fr+\")</div></div>\";";
  html += "  out+=\"<div class='lp' style='background:#F0F9FF'><div class='lf'>EN</div><div class='lv'>\"+Math.round((lg.en/tl)*100)+\"%</div><div class='ll'>Anglais (\"+lg.en+\")</div></div>\";";
  html += "  out+=\"</div></div></div>\";";
  html += "  out+=\"<div class='hc' id='hcard'><div class='hp'><div class='hi'>C</div><div class='hn'><h3>Historique</h3><p>\"+REC.length+\" conversations</p><span class='hbdg'>Cliquer pour voir</span></div><div class='ha'>></div></div></div>\";";
  html += "  document.getElementById('app').innerHTML=out;";
  html += "  document.getElementById('hcard').addEventListener('click',openM);";
  html += "}";

  html += "document.getElementById('lbtn').addEventListener('click', doLogin);";
  html += "document.getElementById('pi').addEventListener('keydown', function(e){if(e.key==='Enter')doLogin();});";
  html += "document.getElementById('rbtn').addEventListener('click', doLoad);";
  html += "document.getElementById('mc').addEventListener('click', closeM);";
  html += "document.getElementById('modal').addEventListener('click', function(e){if(e.target===this)closeM();});";
  html += "</scr" + "ipt></body></html>";

  res.status(200).send(html);
};
