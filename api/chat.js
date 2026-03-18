<!-- Start of HubSpot Embed Code -->
<script type="text/javascript" id="hs-script-loader" async defer src="//js-eu1.hs-scripts.com/139613055.js"></script>
<!-- End of HubSpot Embed Code -->
<!-- Chatbot French Tech Grand Paris -->
<script>
(function() {
  var VERCEL_URL = "https://chatbot-ftgp.vercel.app";

  var PROGRAMS = {
    "track-ia":       { name:"Track Intelligence Artificielle", icon:"🤖", color:"#0045B3", desc:"Accélère ta startup IA avec notre réseau de +150 grands groupes et investisseurs.", tags:["BizDev","Visibilité","Masterclass"], url:"https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle", cta:"Rejoindre le Track IA" },
    "hiit":           { name:"HIIT — HealthTech", icon:"💊", color:"#0E7490", desc:"Programme intensif 1 semaine pour startups MedTech pré-cliniques. 100% gratuit.", tags:["MedTech","Réglementaire","Financement"], url:"https://www.frenchtech-grandparis.com/ft-programs/hiit", cta:"Découvrir HIIT" },
    "tremplin":       { name:"French Tech Tremplin", icon:"🚀", color:"#7C3AED", desc:"Égalité des chances pour entrepreneurs issus de milieux sous-représentés. Bourse jusqu'à 22 900€.", tags:["Diversité","Bourse","Incubation"], url:"https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin", cta:"Candidater à Tremplin" },
    "scaleup":        { name:"Scale-up Excellence", icon:"📈", color:"#160B47", desc:"Le programme qui détecte les futurs FT120. Visibilité et accompagnement privilégié.", tags:["Scale","Accompagnement"], url:"https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence", cta:"Découvrir Scale-up" },
    "ville-de-demain":{ name:"Ville de Demain", icon:"🏙️", color:"#059669", desc:"Connecte ta startup aux 130 communes de la Métropole du Grand Paris.", tags:["Smart City","Collectivités"], url:"https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain", cta:"Rejoindre Ville de Demain" },
    "gen50tech":      { name:"Gen50Tech", icon:"🤝", color:"#D97706", desc:"Combat l'âgisme dans la tech. Programme pour talents +50 ans.", tags:["Inclusion","RH","Diversité"], url:"https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis", cta:"Signer la charte Gen50Tech" },
    "je-choisis":     { name:"Je choisis la French Tech", icon:"💼", color:"#0045B3", desc:"Accède aux achats des 11 grands groupes partenaires : AXA, Orange, SNCF...", tags:["Grands comptes","BizDev"], url:"https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech", cta:"Accéder au programme" },
    "central":        { name:"French Tech Central", icon:"🏛️", color:"#374151", desc:"RDV 1-to-1 avec +60 administrations : INPI, Bpifrance, URSSAF...", tags:["Services publics","Admin"], url:"https://www.frenchtech-grandparis.com/ft-programs/french-tech-central", cta:"Prendre un RDV" }
  };

  var style = document.createElement("style");
  style.textContent =
    "#ftgp-btn{position:fixed;bottom:28px;right:28px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,#0045B3,#160B47);border:none;cursor:pointer;z-index:99999;box-shadow:0 4px 24px rgba(0,69,179,0.5);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;}" +
    "#ftgp-btn:hover{transform:scale(1.08);}" +
    "#ftgp-btn .notif{position:absolute;top:3px;right:3px;width:13px;height:13px;background:#22C55E;border-radius:50%;border:2px solid white;}" +
    "#ftgp-box{position:fixed;bottom:104px;right:28px;width:400px;height:580px;background:#fff;border-radius:22px;z-index:99998;box-shadow:0 16px 56px rgba(22,11,71,0.22);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transform:translateY(12px);opacity:0;transition:width 0.3s,height 0.3s,transform 0.28s cubic-bezier(0.34,1.56,0.64,1),opacity 0.22s;}" +
    "#ftgp-box.open{transform:translateY(0);opacity:1;}" +
    "#ftgp-box.expanded{width:760px;height:720px;}" +
    "#ftgp-head{background:linear-gradient(135deg,#0045B3 0%,#160B47 100%);padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}" +
    "#ftgp-head .logo{width:40px;height:40px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.25);}" +
    "#ftgp-head .logo img{width:28px;height:28px;object-fit:contain;}" +
    "#ftgp-head .info{flex:1;}" +
    "#ftgp-head .name{color:white;font-weight:700;font-size:13px;}" +
    "#ftgp-head .status{color:rgba(255,255,255,0.75);font-size:11px;display:flex;align-items:center;gap:4px;margin-top:2px;}" +
    "#ftgp-head .status::before{content:'';width:6px;height:6px;background:#22C55E;border-radius:50%;display:inline-block;}" +
    ".ftgp-hbtn{background:rgba(255,255,255,0.12);border:none;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;font-size:13px;margin-left:4px;}" +
    ".ftgp-hbtn:hover{background:rgba(255,255,255,0.28);}" +
    "#ftgp-scroll-zone{flex:1;position:relative;overflow:hidden;}" +
    "#ftgp-msgs{height:100%;overflow-y:scroll;padding:14px 14px 8px;display:flex;flex-direction:column;gap:10px;background:#F7F9FF;scroll-behavior:smooth;}" +
    "#ftgp-msgs::-webkit-scrollbar{width:5px;}" +
    "#ftgp-msgs::-webkit-scrollbar-track{background:#EEF2FF;border-radius:10px;}" +
    "#ftgp-msgs::-webkit-scrollbar-thumb{background:#B8C8F0;border-radius:10px;}" +
    "#ftgp-msgs::-webkit-scrollbar-thumb:hover{background:#0045B3;}" +
    ".fm{max-width:86%;display:flex;flex-direction:column;gap:4px;position:relative;}" +
    ".fm.bot{align-self:flex-start;}" +
    ".fm.user{align-self:flex-end;}" +
    ".fm.full{max-width:100%;}" +
    ".fm .bubble{padding:11px 14px;font-size:14px;line-height:1.65;word-break:break-word;}" +
    ".fm.bot .bubble{background:white;color:#160B47;border-radius:18px 18px 18px 4px;box-shadow:0 2px 8px rgba(0,0,0,0.07);}" +
    ".fm.user .bubble{background:linear-gradient(135deg,#0045B3,#0056D6);color:white;border-radius:18px 18px 4px 18px;}" +
    ".fm .meta{font-size:10px;color:#A0AECB;padding:0 4px;display:flex;align-items:center;gap:6px;}" +
    ".fm.user .meta{justify-content:flex-end;}" +
    ".fm a{color:#0045B3;text-decoration:underline;font-weight:600;}" +
    ".fm.user a{color:#fff;}" +
    ".fm strong{font-weight:700;}" +
    ".fm ul{margin:6px 0 4px 16px;padding:0;}" +
    ".fm li{margin-bottom:3px;}" +
    ".ftgp-edit-btn{background:none;border:none;color:rgba(255,255,255,0.7);font-size:11px;cursor:pointer;padding:0;display:none;}" +
    ".fm.user:hover .ftgp-edit-btn{display:inline;}" +
    ".ftgp-reactions{display:flex;gap:4px;opacity:0;transition:opacity 0.18s;margin-top:2px;}" +
    ".fm.bot:hover .ftgp-reactions{opacity:1;}" +
    ".ftgp-react-btn{background:white;border:1.5px solid #E0E8F8;font-size:13px;padding:3px 9px;border-radius:20px;cursor:pointer;transition:all 0.18s;box-shadow:0 1px 4px rgba(0,0,0,0.06);}" +
    ".ftgp-react-btn:hover{transform:scale(1.1);}" +
    ".ftgp-react-btn.active-like{background:#DCFCE7;border-color:#22C55E;}" +
    ".ftgp-react-btn.active-dislike{background:#FEE2E2;border-color:#EF4444;}" +
    ".ftgp-cards{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:8px;}" +
    ".ftgp-card{border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);transition:transform 0.18s;}" +
    ".ftgp-card:hover{transform:translateY(-2px);}" +
    ".ftgp-card-head{padding:12px 14px;display:flex;align-items:center;gap:10px;}" +
    ".ftgp-card-icon{font-size:20px;flex-shrink:0;}" +
    ".ftgp-card-title{color:white;font-weight:700;font-size:14px;}" +
    ".ftgp-card-body{background:white;padding:10px 14px;}" +
    ".ftgp-card-desc{font-size:13px;color:#374151;line-height:1.5;margin-bottom:8px;}" +
    ".ftgp-card-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;}" +
    ".ftgp-tag{background:#EEF2FF;color:#0045B3;font-size:11px;padding:3px 8px;border-radius:20px;font-weight:500;}" +
    ".ftgp-card-btn{display:block;width:100%;padding:10px;border-radius:10px;border:none;color:white;font-weight:700;font-size:13px;text-align:center;text-decoration:none;transition:opacity 0.2s;box-sizing:border-box;}" +
    ".ftgp-card-btn:hover{opacity:0.88;color:white;}" +
    ".ftgp-orb-wrap{align-self:flex-start;display:flex;align-items:center;gap:8px;background:white;padding:10px 14px;border-radius:18px 18px 18px 4px;box-shadow:0 2px 8px rgba(0,0,0,0.06);}" +
    ".ftgp-orb{width:20px;height:20px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#60A5FA,#0045B3,#160B47,#3B82F6);background-size:300% 300%;animation:ftgp-orb-move 2.4s ease-in-out infinite;}" +
    "@keyframes ftgp-orb-move{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}" +
    ".ftgp-orb-text{font-size:12px;color:#8A96B8;font-style:italic;}" +
    ".ftgp-refine{background:white;border-radius:14px;padding:12px 14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex;flex-direction:column;gap:8px;width:100%;}" +
    ".ftgp-refine-title{font-size:13px;font-weight:700;color:#160B47;}" +
    ".ftgp-refine-sub{font-size:12px;color:#6B7A9F;}" +
    ".ftgp-quick-opts{display:flex;flex-wrap:wrap;gap:6px;}" +
    ".ftgp-qopt{background:white;border:1.5px solid #C8D8F8;color:#0045B3;border-radius:20px;padding:6px 13px;font-size:12px;cursor:pointer;font-weight:500;transition:all 0.18s;}" +
    ".ftgp-qopt:hover{background:#0045B3;color:white;border-color:#0045B3;}" +
    "#ftgp-suggs{padding:8px 12px 4px;display:flex;flex-wrap:wrap;gap:6px;background:#F7F9FF;border-top:1px solid #EBF0FF;flex-shrink:0;}" +
    ".fsugg{background:white;border:1.5px solid #C8D8F8;color:#0045B3;border-radius:20px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all 0.22s;white-space:nowrap;font-weight:500;position:relative;overflow:hidden;}" +
    ".fsugg::before{content:'';position:absolute;inset:0;border-radius:20px;background:linear-gradient(120deg,rgba(0,69,179,0.06),rgba(96,165,250,0.12),rgba(22,11,71,0.06));background-size:200% 200%;animation:ftgp-shimmer 3s ease-in-out infinite;}" +
    "@keyframes ftgp-shimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}" +
    ".fsugg:hover{background:linear-gradient(135deg,#0045B3,#160B47);color:white;border-color:transparent;}" +
    ".fsugg:hover::before{opacity:0;}" +
    "#ftgp-inp-wrap{display:flex;padding:10px 12px;gap:6px;background:white;border-top:1px solid #EBF0FF;align-items:center;flex-shrink:0;}" +
    "#ftgp-input{flex:1;border:1.5px solid #E0E8F8;border-radius:14px;padding:10px 14px;font-size:14px;outline:none;background:#F7F9FF;transition:border 0.2s;color:#160B47;}" +
    "#ftgp-input:focus{border-color:#0045B3;background:white;}" +
    ".ftgp-icon-btn{width:40px;height:40px;background:white;border:1.5px solid #E0E8F8;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;flex-shrink:0;text-decoration:none;}" +
    ".ftgp-icon-btn:hover{border-color:#0045B3;background:#EEF2FF;}" +
    "#ftgp-mic.listening{background:linear-gradient(135deg,#FEE2E2,#FECACA);border-color:#EF4444;animation:ftgp-mic-pulse 1s ease-in-out infinite;}" +
    "@keyframes ftgp-mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3);}50%{box-shadow:0 0 0 6px rgba(239,68,68,0);}}" +
    "#ftgp-send{width:40px;height:40px;background:linear-gradient(135deg,#0045B3,#160B47);border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.18s;flex-shrink:0;box-shadow:0 2px 8px rgba(0,69,179,0.3);}" +
    "#ftgp-send:hover{transform:scale(1.06);}" +
    "#ftgp-send:disabled{opacity:0.45;cursor:not-allowed;transform:none;}" +
    "#ftgp-powered{text-align:center;font-size:10px;color:#A0AECB;padding:5px 8px;background:white;flex-shrink:0;}" +
    "@media(max-width:500px){#ftgp-box,#ftgp-box.expanded{width:calc(100vw - 16px);right:8px;bottom:80px;}}";

  document.head.appendChild(style);

  var SUGGESTIONS = ["📅 Prochains événements","🚀 C'est quoi le Track IA ?","💊 Candidater à HIIT ?","🤝 Comment adhérer ?"];
  function getTime(){var n=new Date();return n.getHours()+":"+String(n.getMinutes()).padStart(2,"0");}

  document.body.insertAdjacentHTML("beforeend",
    '<button id="ftgp-btn"><svg width="26" height="26" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><div class="notif"></div></button>'+
    '<div id="ftgp-box">'+
      '<div id="ftgp-head">'+
        '<div class="logo"><img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" alt="FTGP"/></div>'+
        '<div class="info"><div class="name">Assistant French Tech Grand Paris</div><div class="status">En ligne · répond en quelques secondes</div></div>'+
        '<button class="ftgp-hbtn" id="ftgp-expand">⤢</button>'+
        '<button class="ftgp-hbtn" id="ftgp-close">✕</button>'+
      '</div>'+
      '<div id="ftgp-scroll-zone"><div id="ftgp-msgs">'+
        '<div class="fm bot"><div class="bubble">👋 Bonjour ! Je suis l\'assistant de la <strong>French Tech Grand Paris</strong>.<br><br>Programmes, événements, adhésion... pose ta question !</div><div class="meta">'+getTime()+'</div></div>'+
      '</div></div>'+
      '<div id="ftgp-suggs">'+SUGGESTIONS.map(function(s){return '<button class="fsugg">'+s+'</button>';}).join("")+'</div>'+
      '<div id="ftgp-inp-wrap">'+
        '<input type="text" id="ftgp-input" placeholder="Pose ta question..."/>'+
        '<button id="ftgp-mic" class="ftgp-icon-btn" title="Vocal"><svg width="15" height="15" fill="none" stroke="#0045B3" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg></button>'+
        '<a href="https://www.linkedin.com/company/frenchtechgrandparis/" target="_blank" class="ftgp-icon-btn" title="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="#0045B3"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>'+
        '<button id="ftgp-send"><svg width="17" height="17" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>'+
      '</div>'+
      '<div id="ftgp-powered">Propulsé par <strong>Claude AI</strong> · French Tech Grand Paris</div>'+
    '</div>'
  );

  // Déclaration de TOUTES les variables
  var btn = document.getElementById("ftgp-btn");
  var box = document.getElementById("ftgp-box");
  var closeBtn = document.getElementById("ftgp-close");
  var expandBtn = document.getElementById("ftgp-expand");
  var input = document.getElementById("ftgp-input");
  var send = document.getElementById("ftgp-send");
  var mic = document.getElementById("ftgp-mic");
  var msgs = document.getElementById("ftgp-msgs");
  var suggsEl = document.getElementById("ftgp-suggs");
  var history = [];
  var sessionId = "session-" + Date.now();
  var isOpen = false;
  var isExpanded = false;
  var msgCounter = 0;
  var unknownCount = 0;

  // MÉMOIRE SESSION
  function saveSession() {
    try {
      localStorage.setItem("ftgp_history", JSON.stringify(history.slice(-10)));
      localStorage.setItem("ftgp_session", sessionId);
      localStorage.setItem("ftgp_unknown", unknownCount.toString());
    } catch(e) {}
  }
  function loadSession() {
    try {
      var saved = localStorage.getItem("ftgp_history");
      var savedSid = localStorage.getItem("ftgp_session");
      var savedUnknown = localStorage.getItem("ftgp_unknown");
      if (saved) history = JSON.parse(saved);
      if (savedSid) sessionId = savedSid;
      if (savedUnknown) unknownCount = parseInt(savedUnknown) || 0;
    } catch(e) {}
  }
  loadSession();

  function openChat() { box.style.display="flex"; setTimeout(function(){ box.classList.add("open"); }, 10); isOpen=true; input.focus(); }
  function closeChat() { box.classList.remove("open"); setTimeout(function(){ box.style.display="none"; }, 280); isOpen=false; }

  btn.onclick = function() { isOpen ? closeChat() : openChat(); };
  closeBtn.onclick = closeChat;
  expandBtn.onclick = function() { isExpanded=!isExpanded; box.classList.toggle("expanded",isExpanded); expandBtn.textContent=isExpanded?"⤡":"⤢"; };

  document.querySelectorAll(".fsugg").forEach(function(b) {
    b.onclick = function() { input.value=this.textContent.replace(/^[^\s]+\s/,""); suggsEl.style.display="none"; sendMsg(); };
  });

  // VOCAL
  var recognition = null;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR(); recognition.lang="fr-FR"; recognition.continuous=false; recognition.interimResults=true;
    recognition.onstart = function() { mic.classList.add("listening"); input.placeholder="🎤 Je t'écoute..."; };
    recognition.onresult = function(e) {
      var tr=""; for(var i=e.resultIndex;i<e.results.length;i++) tr+=e.results[i][0].transcript;
      input.value=tr;
      if(e.results[e.results.length-1].isFinal){ mic.classList.remove("listening"); input.placeholder="Pose ta question..."; setTimeout(sendMsg,400); }
    };
    recognition.onerror = recognition.onend = function() { mic.classList.remove("listening"); input.placeholder="Pose ta question..."; };
    mic.onclick = function() { mic.classList.contains("listening") ? recognition.stop() : recognition.start(); };
  } else { mic.style.display="none"; }

  function isAskingForPrograms(text) {
    return /quels.{0,20}programmes|liste.{0,15}programme|tous les programmes|nos programmes|vos programmes|présent.{0,15}programmes/i.test(text);
  }

  function buildAllCards() {
    var html = '<div style="font-size:13px;font-weight:700;color:#160B47;margin-bottom:8px;">🗂️ Nos programmes :</div><div class="ftgp-cards">';
    Object.keys(PROGRAMS).forEach(function(k) {
      var p = PROGRAMS[k];
      html += '<div class="ftgp-card"><div class="ftgp-card-head" style="background:'+p.color+'"><span class="ftgp-card-icon">'+p.icon+'</span><span class="ftgp-card-title">'+p.name+'</span></div><div class="ftgp-card-body"><div class="ftgp-card-desc">'+p.desc+'</div><div class="ftgp-card-tags">'+p.tags.map(function(t){return '<span class="ftgp-tag">'+t+'</span>';}).join("")+'</div><a href="'+p.url+'" target="_blank" class="ftgp-card-btn" style="background:'+p.color+'">'+p.cta+' →</a></div></div>';
    });
    return html + '</div>';
  }

  function buildContactHuman() {
    return '<div style="background:linear-gradient(135deg,#F8FAFF,#EEF2FF);border:1.5px solid #C8D8F8;border-radius:16px;padding:14px 16px;width:100%;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<div style="width:42px;height:42px;border-radius:12px;background:white;border:1.5px solid #C8D8F8;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
          '<img src="https://cdn.prod.website-files.com/64a34e8457fd12c08b34c521/64a4ab096ba779243f76749a_coque.svg" style="width:28px;height:28px;object-fit:contain;" alt="FTGP"/>'+
        '</div>'+
        '<div><div style="font-weight:700;font-size:14px;color:#160B47;">Besoin d\'un contact humain ?</div><div style="font-size:12px;color:#6B7A9F;margin-top:2px;">Notre équipe répond rapidement 🙌</div></div>'+
      '</div>'+
      '<a href="mailto:contact@frenchtech-grandparis.com" style="display:block;background:linear-gradient(135deg,#0045B3,#160B47);color:white;text-decoration:none;text-align:center;padding:10px;border-radius:11px;font-weight:700;font-size:13px;">'+
        '📩 Contactez directement ici <span style="opacity:0.8;font-weight:400;">(répondent rapidement)</span>'+
      '</a>'+
      '<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:1px;background:#C8D8F8;"></div><span style="font-size:11px;color:#9BA8C0;white-space:nowrap;">Entre temps</span><div style="flex:1;height:1px;background:#C8D8F8;"></div></div>'+
      '<div style="font-size:12px;color:#374151;text-align:center;">Si vous savez ce que vous voulez, remplissez directement ce formulaire :</div>'+
      '<a href="https://airtable.com/appv5cXO7MVspaMp8/pagjnriyF9NFBDfxJ/form" target="_blank" style="display:block;background:white;border:1.5px solid #0045B3;color:#0045B3;text-decoration:none;text-align:center;padding:10px;border-radius:11px;font-weight:700;font-size:13px;">'+
        '📋 Remplir le formulaire →'+
      '</a>'+
    '</div>';
  }

  function parseMarkdown(t) {
    return t
      .replace(/\*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\*/g,'<a href="$2" target="_blank" rel="noopener"><strong><em>$1</em></strong></a>')
      .replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g,'<a href="$2" target="_blank" rel="noopener"><strong>$1</strong></a>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*\*([^*]+)\*\*\*/g,"<strong><em>$1</em></strong>")
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g,"<em>$1</em>")
      .replace(/^[•\-]\s+(.+)$/gm,"<li>$1</li>")
      .replace(/(<li>[^<]*<\/li>\n?)+/g,function(m){return "<ul>"+m+"</ul>";})
      .replace(/\n/g,"<br>");
  }

  function addBotMsg(text, showCards, question) {
    msgCounter++;
    var id = msgCounter;
    var w = document.createElement("div");
    w.className = "fm bot" + (showCards ? " full" : "");
    w.id = "ftgp-msg-" + id;
    w.setAttribute("data-question", question || "");
    w.setAttribute("data-answer", text);
    w.setAttribute("data-dislikes", "0");
    var b = document.createElement("div"); b.className="bubble"; b.innerHTML=parseMarkdown(text);
    var meta = document.createElement("div"); meta.className="meta"; meta.textContent=getTime();
    var r = document.createElement("div"); r.className="ftgp-reactions";
    r.innerHTML='<button class="ftgp-react-btn" id="like-'+id+'" onclick="window.ftgpLike('+id+')">👍</button><button class="ftgp-react-btn" id="dis-'+id+'" onclick="window.ftgpDislike('+id+')">👎</button>';
    w.appendChild(b); w.appendChild(meta); w.appendChild(r);
    if (showCards) { var cd=document.createElement("div"); cd.innerHTML=buildAllCards(); while(cd.firstChild) w.appendChild(cd.firstChild); }
    msgs.appendChild(w); msgs.scrollTop=msgs.scrollHeight;
  }

  function addUserMsg(text) {
    msgCounter++;
    var id = msgCounter;
    var w = document.createElement("div"); w.className="fm user"; w.id="ftgp-msg-"+id; w.setAttribute("data-text",text);
    var b = document.createElement("div"); b.className="bubble"; b.textContent=text;
    var meta = document.createElement("div"); meta.className="meta";
    meta.innerHTML='<button class="ftgp-edit-btn" onclick="window.ftgpEdit('+id+')">✏️ Modifier</button>'+getTime();
    w.appendChild(b); w.appendChild(meta);
    msgs.appendChild(w); msgs.scrollTop=msgs.scrollHeight;
  }

  window.ftgpLike = function(id) {
    document.getElementById("like-"+id).classList.toggle("active-like");
    document.getElementById("dis-"+id).classList.remove("active-dislike");
  };

  window.ftgpDislike = function(id) {
    var wrap=document.getElementById("ftgp-msg-"+id);
    var disBtn=document.getElementById("dis-"+id);
    var likeBtn=document.getElementById("like-"+id);
    var dislikes=parseInt(wrap.getAttribute("data-dislikes")||"0");
    if(disBtn.classList.contains("active-dislike")){ disBtn.classList.remove("active-dislike"); return; }
    disBtn.classList.add("active-dislike"); likeBtn.classList.remove("active-like");
    dislikes++; wrap.setAttribute("data-dislikes",dislikes);
    var question=wrap.getAttribute("data-question")||"";
    var answer=wrap.getAttribute("data-answer")||"";
    if(dislikes===1){
      var loadEl=document.createElement("div"); loadEl.className="fm bot full"; loadEl.id="ftgp-refine-"+id;
      loadEl.innerHTML='<div class="ftgp-orb-wrap"><div class="ftgp-orb"></div><span class="ftgp-orb-text">Analyse ta question...</span></div>';
      msgs.appendChild(loadEl); msgs.scrollTop=msgs.scrollHeight;
      fetch(VERCEL_URL+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:question,context:answer,mode:"refine",session_id:sessionId,history:[]})})
      .then(function(r){return r.json();})
      .then(function(d){
        var el=document.getElementById("ftgp-refine-"+id);
        if(el){
          var opts=d.refinements||["Mon secteur est différent","Je cherche du financement","Je veux plus de détails","Ma startup est early stage"];
          el.innerHTML='<div class="ftgp-refine"><div class="ftgp-refine-title">✨ Affinons ta question !</div><div class="ftgp-refine-sub">Sélectionne ce qui correspond mieux :</div><div class="ftgp-quick-opts">'+opts.map(function(o){return '<button class="ftgp-qopt" onclick="window.ftgpRefineQ(\''+o.replace(/'/g,"\\'")+'\')">'+o+'</button>';}).join("")+'</div></div>';
          msgs.scrollTop=msgs.scrollHeight;
        }
      }).catch(function(){var el=document.getElementById("ftgp-refine-"+id);if(el)el.remove();});
    } else if(dislikes>=2){
      var sorryEl=document.createElement("div"); sorryEl.className="fm bot full";
      sorryEl.innerHTML='<div class="bubble" style="background:white;border-radius:18px 18px 18px 4px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-size:14px;color:#160B47;margin-bottom:8px;">😔 Je suis navrée de ne pas avoir pu t\'apporter la réponse attendue. Notre équipe sera bien mieux placée pour t\'aider !</div>'+buildContactHuman();
      msgs.appendChild(sorryEl); msgs.scrollTop=msgs.scrollHeight;
      disBtn.classList.remove("active-dislike"); wrap.setAttribute("data-dislikes","0");
    }
  };

  window.ftgpRefineQ = function(opt) { input.value=opt; sendMsg(); };
  window.ftgpEdit = function(id) { var w=document.getElementById("ftgp-msg-"+id); if(w){ input.value=w.getAttribute("data-text"); w.remove(); input.focus(); } };

  function addOrb(){var w=document.createElement("div");w.className="ftgp-orb-wrap";w.id="ftgp-orb";w.innerHTML='<div class="ftgp-orb"></div><span class="ftgp-orb-text">En train de réfléchir...</span>';msgs.appendChild(w);msgs.scrollTop=msgs.scrollHeight;}
  function removeOrb(){var o=document.getElementById("ftgp-orb");if(o)o.remove();}

  function sendMsg() {
    var msg=input.value.trim(); if(!msg) return;
    input.value=""; suggsEl.style.display="none";
    addUserMsg(msg);
    history.push({role:"user",content:msg});
    saveSession();
    addOrb(); send.disabled=true;
    var wantCards=isAskingForPrograms(msg);
    fetch(VERCEL_URL+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,session_id:sessionId,history:history,mode:"chat",unknown_count:unknownCount})})
    .then(function(r){return r.json();})
    .then(function(d){
      removeOrb();
      if(wantCards){ addBotMsg("Voici tous les programmes de la **French Tech Grand Paris** :",true,msg); }
      else { addBotMsg(d.reply,false,msg); }
      if(d.unknown_count !== undefined) unknownCount=d.unknown_count;
      if(d.escalade){
        setTimeout(function(){
          var el=document.createElement("div"); el.className="fm bot full";
          el.innerHTML=buildContactHuman(); msgs.appendChild(el); msgs.scrollTop=msgs.scrollHeight;
        },500);
      }
      history.push({role:"assistant",content:d.reply||""}); saveSession(); send.disabled=false;
    }).catch(function(){
      removeOrb(); addBotMsg("Oups, problème de connexion. Réessaie ou contacte-nous : contact@frenchtech-grandparis.com",false,msg); send.disabled=false;
    });
  }

  send.onclick=sendMsg;
  input.addEventListener("keydown",function(e){if(e.key==="Enter")sendMsg();});
})();
</script>
