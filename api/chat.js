const { createClient } = require("@supabase/supabase-js");

/* ── Cache pages (1h) ────────────────────────────────────────────────────── */
var pageCache = {};
var CACHE_TTL = 60 * 60 * 1000;

/* ── URLs du site FTGP ───────────────────────────────────────────────────── */
const ALL_URLS = {
  "track-ia":            "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "scaleup":             "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "gen50tech":           "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "je-choisis":          "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "ville-de-demain":     "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "hiit":                "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "tremplin":            "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":             "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":          "https://www.frenchtech-grandparis.com/programmes",
  "evenements":          "https://www.frenchtech-grandparis.com/evenements",
  "adhesion":            "https://www.frenchtech-grandparis.com/adhesion",
  "qui-sommes-nous":     "https://www.frenchtech-grandparis.com/qui-sommes-nous",
  "contact":             "https://www.frenchtech-grandparis.com/contact",
  "partenaires-publics": "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-publics",
  "partenaires-prives":  "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives",
  "accueil":             "https://www.frenchtech-grandparis.com"
};

/* ── RAG STATIQUE — SANS aucun prix ni date inventés ────────────────────── */
/* IMPORTANT : Les prix, dates et statuts sont TOUJOURS lus sur le site en direct.
   Ce RAG contient uniquement les descriptions stables qui ne changent pas. */
const STATIC_RAG = `
=== FRENCH TECH GRAND PARIS — DESCRIPTIONS STABLES ===

RÈGLE ABSOLUE : Ne jamais inventer de prix, de dates ou de statut de candidature.
Ces informations sont UNIQUEMENT disponibles sur le site en direct.
Si le scraping ne retourne pas ces infos → dire "Je t'invite à vérifier sur notre site".

--- ADHÉSION ---
L'adhésion FTGP donne accès à l'ensemble des programmes.
Les tarifs exacts et conditions sont disponibles sur : https://www.frenchtech-grandparis.com/adhesion
Contact : contact@frenchtech-grandparis.com

--- TRACK INTELLIGENCE ARTIFICIELLE ---
Pour startups et scale-ups avec l'IA au cœur du produit. Adhésion FTGP obligatoire.
Objectifs : accès grands groupes, masterclasses IA, visibilité, cartographie IA.
URL : https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle

--- HIIT (Health Innovation Intensive Track) ---
Pour startups MedTech / HealthTech en phase pré-clinique.
Format : programme intensif d'1 semaine. Gratuit.
Statut candidatures et dates : voir le site.
URL : https://www.frenchtech-grandparis.com/ft-programs/hiit

--- FRENCH TECH TREMPLIN ---
Pour entrepreneurs issus de milieux sous-représentés.
Critères : bénéficiaires RSA/AAH/ASS, étudiants boursiers, résidents QPV/ZRR, réfugiés OFPRA.
Montant de la bourse et dates : voir le site.
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin

--- SCALE-UP EXCELLENCE ---
Pour scale-ups adhérentes à fort potentiel. Détection futurs Next40/FT120.
URL : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence

--- VILLE DE DEMAIN ---
Pour startups proposant des solutions aux collectivités. 130 communes Métropole Grand Paris.
URL : https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain

--- GEN50TECH ---
Programme contre l'âgisme tech. Pour talents +50 ans.
URL : https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis

--- JE CHOISIS LA FRENCH TECH ---
Reverse pitchs avec grands groupes partenaires : AXA, Orange, SNCF, BNP...
URL : https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech

--- FRENCH TECH CENTRAL ---
RDV 1-to-1 avec +60 administrations publiques : INPI, Bpifrance, URSSAF...
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-central

--- ÉVÉNEMENTS ---
Dates et détails toujours sur : https://www.frenchtech-grandparis.com/evenements

--- CONTACT ---
Email : contact@frenchtech-grandparis.com
Formulaire : https://airtable.com/appv5cXO7MVspaMp8/pagjnriyF9NFBDfxJ/form
Ne jamais communiquer les coordonnées personnelles de l'équipe.
`;

/* ── Détection pages ─────────────────────────────────────────────────────── */
function detectPages(q) {
  var q2 = q.toLowerCase();
  var qn = q2.normalize ? q2.normalize("NFD").replace(/[\u0300-\u036f]/g,"") : q2;
  var p  = [];
  if (/track.?ia|intelligence.?artif|cartographie/.test(qn)) p.push("track-ia");
  if (/scaleup|scale.?up|excellence/.test(qn)) p.push("scaleup");
  if (/gen50|50.?ans|senior|agisme/.test(qn)) p.push("gen50tech");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(qn)) p.push("je-choisis");
  if (/ville.?demain|smart.?city|collectivit/.test(qn)) p.push("ville-de-demain");
  if (/hiit|medtech|healthtech|clinique|sante/.test(qn)) p.push("hiit");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(qn)) p.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(qn)) p.push("central");
  if (/programme|tous les|liste|accompagnement/.test(qn)) p.push("programmes");
  if (/evenement|event|soiree|agenda|date|calendrier|find.?your|networking|prochain/.test(qn) ||
      /\u00e9v\u00e9nement|\u00e9v\u00e8nement|soir\u00e9e/.test(q2)) p.push("evenements");
  // Adhésion : détection très large pour capturer prix/tarifs/coût
  if (/adhesion|adherer|membre|rejoindre|tarif|prix|cout|combien|abonnement|cotisation/.test(qn)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(qn)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(qn)) p.push("contact");
  if (/partenaire.?public/.test(qn)) p.push("partenaires-publics");
  if (/partenaire.?priv|perk/.test(qn)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

/* ── Scraping avec Firecrawl (JS rendu) + fallback Jina ─────────────────── */
async function scrapeWithRetry(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content;
  }

  // Tentative 1 — Firecrawl (lit le JS rendu, donc voit les vrais prix)
  try {
    var ctrl = new AbortController();
    var t    = setTimeout(function(){ ctrl.abort(); }, 8000);
    var res  = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (process.env.FIRECRAWL_API_KEY || "fc-free")
      },
      body: JSON.stringify({ url: url, formats: ["markdown"], onlyMainContent: true }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (res.ok) {
      var data = await res.json();
      var content = data.data && data.data.markdown ? data.data.markdown : null;
      if (content && content.length > 150) {
        content = content.substring(0, 4000);
        pageCache[url] = { content: content, time: now };
        return content;
      }
    }
  } catch(e) { /* fallback */ }

  // Tentative 2 — Jina (fallback si Firecrawl échoue)
  for (var i = 0; i < 2; i++) {
    try {
      var ctrl2 = new AbortController();
      var t2    = setTimeout(function(){ ctrl2.abort(); }, 6000);
      var res2  = await fetch("https://r.jina.ai/" + url, {
        headers: { "Accept": "text/plain", "X-Return-Format": "text" },
        signal: ctrl2.signal
      });
      clearTimeout(t2);
      if (!res2.ok) continue;
      var txt = await res2.text();
      if (!txt || txt.length < 150) continue;
      var content2 = txt.substring(0, 4000);
      pageCache[url] = { content: content2, time: now };
      return content2;
    } catch(e2) {
      if (i < 1) await new Promise(function(r){ setTimeout(r, 800); });
    }
  }

  return null;
}

/* ── Embeddings HuggingFace ──────────────────────────────────────────────── */
async function getEmbedding(text) {
  try {
    var res = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
      {
        method: "POST",
        headers: { "Authorization": "Bearer "+process.env.HF_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text })
      }
    );
    if (!res.ok) return null;
    var data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      var avg = new Array(data[0].length).fill(0);
      for (var i=0;i<data.length;i++) for (var j=0;j<data[0].length;j++) avg[j]+=data[i][j]/data.length;
      return avg;
    }
    return Array.isArray(data) ? data : null;
  } catch(e) { return null; }
}

/* ── Hybrid search Supabase ──────────────────────────────────────────────── */
async function hybridSearch(query, embedding) {
  try {
    var sb  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    var res = await sb.rpc("hybrid_search", { query_text: query, query_embedding: embedding, match_count: 3 });
    if (res.error || !res.data) return [];
    return res.data;
  } catch(e) { return []; }
}

/* ── Date du jour ────────────────────────────────────────────────────────── */
function getToday() {
  var n      = new Date();
  var days   = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()]+" "+n.getDate()+" "+months[n.getMonth()]+" "+n.getFullYear();
}

/* ── Détection langue ────────────────────────────────────────────────────── */
function detectLang(text) {
  var en = /(\b(the|is|are|what|how|when|where|who|can|could|would|have|will|do|does|my|your|this|that|and|for|with|from|about)\b)/i.test(text);
  var fr = /[àâäéèêëîïôùûüç]|(\b(je|tu|il|nous|vous|est|les|des|une|pour|avec|dans|que|qui|pas|mais|donc)\b)/i.test(text);
  if (en && !fr) return "en";
  return "fr";
}

/* ── Handler principal ───────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  var body         = req.body || {};
  var message      = body.message;
  var sid          = body.session_id || ("anon-"+Date.now());
  var history      = body.history    || [];
  var mode         = body.mode       || "chat";
  var unknownCount = body.unknown_count || 0;
  var refineStep   = body.refine_step   || 1;
  var refinePath   = body.refine_path   || [];
  var lastAnswer   = body.last_answer   || "";
  var forcedLang   = body.lang          || null;

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();
    var lang  = forcedLang || detectLang(message);

    /* ── MODE REFINE ──────────────────────────────────────────────── */
    if (mode === "refine") {
      var FIXED = {
        1: { q:"Quel est ton profil ?",             opts:["Startup / Scale-up","Grand groupe / ETI","Investisseur","Porteur de projet"] },
        2: { q:"Quel est ton objectif principal ?", opts:["Trouver des financements","Accéder à des clients","Être accompagné","Rejoindre un programme"] },
        3: { q:"Quel est ton secteur ?",            opts:["Intelligence Artificielle","HealthTech / MedTech","GreenTech / CleanTech","Autre tech"] },
        4: { q:"Quel est ton stade ?",              opts:["Idée / Pre-seed","Seed / Série A","Série B+","Déjà établi"] }
      };

      if (refineStep > 4 && refineStep <= 10) {
        var fp =
          "Tu es expert relation client FTGP.\nProfil : "+refinePath.join(", ")+"\nQuestion : "+message+"\n\n"+
          STATIC_RAG+"\n\nFournis une recommandation personnalisée, 3 max, avec liens. Ne jamais inventer de prix.\n"+
          (lang==="en"?"Respond in English.":"Réponds en français.");
        try {
          var fr2 = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:600, system:fp, messages:[{role:"user",content:"Génère la recommandation."}] })
          });
          var fd = await fr2.json();
          var fa = fd.content && fd.content[0] ? fd.content[0].text : null;
          return res.status(200).json({ final_answer: fa || "Contacte-nous : contact@frenchtech-grandparis.com" });
        } catch(e) {
          return res.status(200).json({ final_answer: "Contacte notre équipe : contact@frenchtech-grandparis.com" });
        }
      }

      if (refineStep > 10) {
        var ap =
          "Génère 4 questions courtes (max 6 mots) différentes du parcours ("+refinePath.join(", ")+"), "+
          "liées à la dernière réponse : "+lastAnswer+"\n"+
          "Réponds UNIQUEMENT avec ce JSON : {\"question\": \"...\", \"options\": [\"...\",\"...\",\"...\",\"...\"]}";
        try {
          var ar = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:200, system:ap, messages:[{role:"user",content:"Génère."}] })
          });
          var ad = await ar.json();
          var at = ad.content && ad.content[0] ? ad.content[0].text.replace(/```json|```/g,"").trim() : null;
          var parsed = at ? JSON.parse(at) : null;
          if (parsed && parsed.question && parsed.options)
            return res.status(200).json({ refine_step: refineStep, question: parsed.question, options: parsed.options });
        } catch(e) {}
        return res.status(200).json({ refine_step: refineStep, question: "Qu'est-ce qui te manque ?", options: ["Plus de détails","Les conditions d'accès","Les prochaines dates","Parler à quelqu'un"] });
      }

      var step = FIXED[refineStep] || FIXED[1];
      return res.status(200).json({ refine_step: refineStep, question: step.q, options: step.opts });
    }

    /* ── MODE CHAT ────────────────────────────────────────────────── */
    var pages = detectPages(message);

    // Scraping + embeddings en parallèle
    var results = await Promise.all([
      Promise.all(
        pages.slice(0,2).map(function(p) {
          return scrapeWithRetry(ALL_URLS[p]).then(function(c) {
            return c ? "=== CONTENU LIVE : "+ALL_URLS[p]+" ===\n"+c : null;
          });
        })
      ).then(function(r){ return r.filter(Boolean).join("\n\n"); }),
      getEmbedding(message)
    ]);

    var liveContent = results[0];
    var embedding   = results[1];
    var ragContent  = "";

    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks && chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    // Indicateur de qualité du scraping pour le prompt
    var scrapeStatus = liveContent
      ? "✅ Contenu live récupéré avec succès — utilise ces informations en priorité absolue."
      : "⚠️ Scraping indisponible — ne PAS inventer de prix, dates ou statuts. Renvoyer vers le site.";

    var ctx = scrapeStatus + "\n\n";
    if (liveContent) ctx += "=== SITE EN DIRECT (PRIORITÉ ABSOLUE) ===\n" + liveContent + "\n\n";
    ctx += "=== BASE DE CONNAISSANCE STABLE ===\n" + STATIC_RAG;
    if (ragContent)  ctx += "\n\n=== RAG SUPABASE ===\n" + ragContent;

    var langLine     = lang==="en" ? "Respond ONLY in English." : "Réponds UNIQUEMENT en français.";
    var escaladeNote = unknownCount >= 2 ? "\nOriente vers l'équipe et ajoute ##ESCALADE## à la fin." : "";

    var system =
      "Tu es l'assistant officiel de la French Tech Grand Paris. Aujourd'hui : "+today+"\n"+
      langLine+"\n\n"+
      "RÈGLES ANTI-HALLUCINATION — CRITIQUES :\n"+
      "• PRIX / TARIFS : Ne jamais inventer. Si le contenu live contient les prix → cite-les exactement. Si pas dans le contenu live → dis 'les tarifs sont disponibles sur notre page adhésion' + lien.\n"+
      "• DATES / STATUTS CANDIDATURES : Idem. Jamais d'invention. Toujours renvoyer vers la page concernée si absent.\n"+
      "• NOMS DE PERSONNES / CONTACTS PERSO : Jamais. Contact = contact@frenchtech-grandparis.com uniquement.\n"+
      "• Hors FTGP → décline poliment.\n"+
      "• Tu ne connais pas l'identité de la personne.\n\n"+
      "PRIORITÉ DES SOURCES :\n"+
      "1. Contenu live du site (PRIORITÉ ABSOLUE)\n"+
      "2. Base de connaissance stable\n"+
      "3. RAG Supabase\n"+
      "En cas de contradiction → toujours le site live gagne.\n\n"+
      "STYLE :\n"+
      "• Professionnel, chaleureux, tutoiement. Max 1 émoji.\n"+
      "• Pas de syntaxe Markdown brute (#, ##, ---).\n"+
      "• **gras** pour titres, • pour listes, [texte](url) pour liens.\n"+
      "• Si tu ne sais pas → ##INCONNU## en fin de réponse.\n"+
      escaladeNote+"\n\n"+
      "CONTEXTE :\n"+ctx;

    var msgsArr = history.slice(-6).map(function(m){ return {role:m.role, content:m.content}; });
    msgsArr.push({role:"user", content:message});

    var llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:700, system:system, messages:msgsArr })
    });

    if (!llmRes.ok) {
      return res.status(200).json({ reply:"Problème technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
    }

    var data  = await llmRes.json();
    var reply = data.content && data.content[0] ? data.content[0].text : null;
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    var isUnknown  = reply.includes("##INCONNU##");
    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown = isUnknown ? unknownCount+1 : unknownCount;
    reply = reply.replace(/##INCONNU##|##ESCALADE##/g,"").trim();

    // Log Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        sb.from("chat_logs").insert({ session_id:sid, question:message, answer:reply, scrape_ok: !!liveContent }).then(function(){}).catch(function(){});
      } catch(e) {}
    }

    return res.status(200).json({ reply:reply, session_id:sid, unknown_count:newUnknown, escalade:isEscalade });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
