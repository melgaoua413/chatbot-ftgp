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

/* ── RAG STATIQUE — PRIX ET AVANTAGES OFFICIELS ─────────────────────────── */
const STATIC_RAG = `
=== FRENCH TECH GRAND PARIS — BASE DE CONNAISSANCE OFFICIELLE ===

--- ADHÉSION — TARIFS ET AVANTAGES OFFICIELS ---
Page officielle : https://www.frenchtech-grandparis.com/adhesion
Contact : contact@frenchtech-grandparis.com

== STARTUP — 499€/an ==
Avantages inclus (formule Standard) :
• Invitation aux événements organisés par la French Tech Grand Paris
• Utilisation de la marque French Tech Grand Paris sur site web et supports de communication
• Accès aux perks de nos partenaires
• Accès à une plateforme d'échange (WhatsApp) entre les membres FTGP
• Accès facilité aux services publics de French Tech Central
• Invitation au déjeuner onboarding des nouveaux membres
• Billets gratuits pour certains événements clés (FD Day, VivaTech, NoCode Summit, RAISE Summit, Innopolis, etc.) — sous réserve de disponibilités
• Mastermind sessions : co-développement entre pairs
• Reverse Pitchs : grands groupes, ETI et administrations présentent leurs besoins d'innovation
• Reverse Pitchs VC : les fonds d'investissement présentent leur thèse et sélection de portfolio
• Formations IA par les pairs : ateliers pratiques animés par des membres experts
• Possibilité d'être ambassadeur d'une de nos verticales

== INCUBATEURS & ACCÉLÉRATEURS — 1 500€/an ==
Avantages inclus :
• Autorisation d'utiliser le logo La French Tech Grand Paris sur site web et supports de communication
• Organisation d'un événement sur une thématique précise (sur demande)
• Relai de vos AAC et AAP auprès de la communauté (Newsletter, WhatsApp membres, LinkedIn, site web)
• Réduction de -50% pour les start-ups incubées sur leur adhésion startup
• Invitation aux événements organisés par la FTGP dont la Summer Party (300 acteurs de l'écosystème tech)

== FONDS D'INVESTISSEMENT — 2 000€/an ==
Avantages inclus :
• Accès à l'annuaire des membres et mise en relation au cas par cas
• Autorisation d'utiliser le logo La French Tech Grand Paris sur site web et supports de communication
• Communication des activités du fonds auprès de notre réseau
• Interview vidéo diffusée sur la chaîne YouTube et LinkedIn FTGP
• Possibilité d'intervention sur des événements thématiques
• Invitation aux événements organisés par la FTGP dont la Summer Party (300 acteurs)
• Invitation au Demo Day bi-annuel
• Organisation d'un événement sur une thématique précise (sur demande)

== PME — 5 000€/an ==
Avantages inclus :
• Autorisation d'utiliser le logo La French Tech Grand Paris sur site web et supports de communication
• Accès à l'annuaire des membres et mise en relation au cas par cas
• Relai de vos AAC et AAP auprès de la communauté (Newsletter, WhatsApp membres, LinkedIn, site web)
• Possibilité d'intervention sur nos événements
• Invitation aux événements organisés par la FTGP dont la Summer Party (300 acteurs)
• Interview vidéo diffusée sur la chaîne YouTube et LinkedIn FTGP
• Organisation d'un événement sur une thématique précise (sur demande)

== ETI & GRANDS GROUPES — 10 000€/an ==
Avantages inclus :
• Présence du logo sur le site web en tant que partenaire
• Autorisation d'utiliser le logo La French Tech Grand Paris sur site web et supports de communication
• Relai de vos AAC et AAP auprès de la communauté (Newsletter, WhatsApp membres, LinkedIn, site web)
• Possibilité d'intervention sur nos événements
• Invitation à nos événements exclusifs types cocktail dînatoire
• Invitation aux événements organisés par la FTGP dont la Summer Party (300 acteurs)
• Interview vidéo diffusée sur la chaîne YouTube et LinkedIn FTGP
• Organisation d'un événement sur une thématique précise (sur demande)

--- PROGRAMMES ---

TRACK INTELLIGENCE ARTIFICIELLE
Pour startups et scale-ups avec l'IA au cœur du produit. Adhésion FTGP obligatoire.
Objectifs : accès à +150 grands groupes, masterclasses IA, visibilité, cartographie IA.
URL : https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle

HIIT — Health Innovation Intensive Track
Pour startups MedTech / HealthTech en phase pré-clinique. Programme intensif d'1 semaine. Gratuit.
Statut candidatures et dates : toujours vérifier sur le site.
URL : https://www.frenchtech-grandparis.com/ft-programs/hiit

FRENCH TECH TREMPLIN
Pour entrepreneurs issus de milieux sous-représentés.
Critères : bénéficiaires RSA/AAH/ASS, étudiants boursiers échelon 5-7, résidents QPV/ZRR, réfugiés OFPRA/CNDA.
Montant bourse et dates : voir le site.
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin

SCALE-UP EXCELLENCE
Pour scale-ups adhérentes à fort potentiel. Détection futurs Next40/FT120.
URL : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence

VILLE DE DEMAIN
Pour startups proposant des solutions aux collectivités. 130 communes Métropole Grand Paris.
URL : https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain

GEN50TECH
Programme contre l'âgisme tech. Pour talents +50 ans.
URL : https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis

JE CHOISIS LA FRENCH TECH
Reverse pitchs avec grands groupes partenaires : AXA, Orange, SNCF, BNP...
URL : https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech

FRENCH TECH CENTRAL
RDV 1-to-1 avec +60 administrations : INPI, Bpifrance, URSSAF...
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-central

--- ÉVÉNEMENTS ---
Dates et détails : https://www.frenchtech-grandparis.com/evenements

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
  if (/adhesion|adherer|membre|rejoindre|tarif|prix|cout|combien|abonnement|cotisation/.test(qn)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(qn)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(qn)) p.push("contact");
  if (/partenaire.?public/.test(qn)) p.push("partenaires-publics");
  if (/partenaire.?priv|perk/.test(qn)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

/* ── Scraping Firecrawl + fallback Jina ──────────────────────────────────── */
async function scrapeWithRetry(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content;
  }

  // Tentative 1 — Firecrawl (exécute le JS, voit les vrais prix)
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      var ctrl = new AbortController();
      var t    = setTimeout(function(){ ctrl.abort(); }, 8000);
      var res  = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.FIRECRAWL_API_KEY },
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
    } catch(e) {}
  }

  // Tentative 2 — Jina (fallback)
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
      var c2 = txt.substring(0, 4000);
      pageCache[url] = { content: c2, time: now };
      return c2;
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
        headers: { "Authorization": "Bearer " + process.env.HF_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text })
      }
    );
    if (!res.ok) return null;
    var data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      var avg = new Array(data[0].length).fill(0);
      for (var i = 0; i < data.length; i++)
        for (var j = 0; j < data[0].length; j++) avg[j] += data[i][j] / data.length;
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
  return days[n.getDay()] + " " + n.getDate() + " " + months[n.getMonth()] + " " + n.getFullYear();
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
  var sid          = body.session_id  || ("anon-" + Date.now());
  var history      = body.history     || [];
  var mode         = body.mode        || "chat";
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
        1: { q: "Quel est ton profil ?",             opts: ["Startup / Scale-up","Grand groupe / ETI","Investisseur","Porteur de projet"] },
        2: { q: "Quel est ton objectif principal ?", opts: ["Trouver des financements","Accéder à des clients","Être accompagné","Rejoindre un programme"] },
        3: { q: "Quel est ton secteur ?",            opts: ["Intelligence Artificielle","HealthTech / MedTech","GreenTech / CleanTech","Autre tech"] },
        4: { q: "Quel est ton stade ?",              opts: ["Idée / Pre-seed","Seed / Série A","Série B+","Déjà établi"] }
      };

      // Réponse finale après les 4 étapes fixes
      if (refineStep > 4 && refineStep <= 10) {
        var fp =
          "Tu es expert relation client de la French Tech Grand Paris.\n" +
          "Profil utilisateur : " + refinePath.join(", ") + "\n" +
          "Question initiale : " + message + "\n\n" +
          STATIC_RAG + "\n\n" +
          "Fournis une recommandation personnalisée, max 3 points, avec liens exacts.\n" +
          (lang === "en" ? "Respond in English." : "Réponds en français.");
        try {
          var fr2 = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, system: fp, messages: [{ role: "user", content: "Génère la recommandation." }] })
          });
          var fd = await fr2.json();
          var fa = fd.content && fd.content[0] ? fd.content[0].text : null;
          return res.status(200).json({ final_answer: fa || "Contacte-nous : contact@frenchtech-grandparis.com" });
        } catch(e) {
          return res.status(200).json({ final_answer: "Contacte notre équipe : contact@frenchtech-grandparis.com" });
        }
      }

      // Questions adaptatives (2ème dislike)
      if (refineStep > 10) {
        var ap =
          "Génère 4 questions courtes (max 6 mots) différentes du parcours (" + refinePath.join(", ") + "), " +
          "liées à la dernière réponse : " + lastAnswer + "\n" +
          "Réponds UNIQUEMENT avec ce JSON (rien d'autre) : {\"question\": \"...\", \"options\": [\"...\",\"...\",\"...\",\"...\"]}";
        try {
          var ar = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200, system: ap, messages: [{ role: "user", content: "Génère." }] })
          });
          var ad = await ar.json();
          var at = ad.content && ad.content[0] ? ad.content[0].text.replace(/```json|```/g,"").trim() : null;
          var parsed = at ? JSON.parse(at) : null;
          if (parsed && parsed.question && parsed.options)
            return res.status(200).json({ refine_step: refineStep, question: parsed.question, options: parsed.options });
        } catch(e) {}
        return res.status(200).json({ refine_step: refineStep, question: "Qu'est-ce qui te manque ?", options: ["Plus de détails","Les conditions d'accès","Les prochaines dates","Parler à quelqu'un"] });
      }

      // Étapes fixes 1-4
      var step = FIXED[refineStep] || FIXED[1];
      return res.status(200).json({ refine_step: refineStep, question: step.q, options: step.opts });
    }

    /* ── MODE CHAT ────────────────────────────────────────────────── */
    var pages = detectPages(message);

    // Scraping + embeddings en parallèle
    var results = await Promise.all([
      Promise.all(
        pages.slice(0, 2).map(function(p) {
          return scrapeWithRetry(ALL_URLS[p]).then(function(c) {
            return c ? "=== CONTENU LIVE : " + ALL_URLS[p] + " ===\n" + c : null;
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

    var scrapeStatus = liveContent
      ? "✅ Contenu live récupéré — priorité absolue sur ce contenu."
      : "⚠️ Scraping indisponible — utilise uniquement la base de connaissance ci-dessous. Ne jamais inventer de dates ou statuts de candidature.";

    var ctx = scrapeStatus + "\n\n";
    if (liveContent) ctx += "=== SITE EN DIRECT (PRIORITÉ ABSOLUE) ===\n" + liveContent + "\n\n";
    ctx += "=== BASE DE CONNAISSANCE OFFICIELLE ===\n" + STATIC_RAG;
    if (ragContent)  ctx += "\n\n=== RAG SUPABASE ===\n" + ragContent;

    var langLine     = lang === "en" ? "Respond ONLY in English. Never use French." : "Réponds UNIQUEMENT en français.";
    var escaladeNote = unknownCount >= 2 ? "\nOriente vers l'équipe et ajoute ##ESCALADE## à la fin." : "";

    var system =
      "Tu es l'assistant officiel de la French Tech Grand Paris. Aujourd'hui : " + today + "\n" +
      langLine + "\n\n" +
      "RÈGLES ANTI-HALLUCINATION :\n" +
      "• PRIX : Les tarifs officiels sont dans la base de connaissance — cite-les exactement. Ne jamais inventer d'autres chiffres.\n" +
      "• DATES / STATUTS CANDIDATURES : Si absent du contenu live → renvoyer vers la page concernée. Jamais d'invention.\n" +
      "• CONTACTS PERSO : Jamais. Uniquement contact@frenchtech-grandparis.com\n" +
      "• Hors FTGP → décline poliment.\n" +
      "• Tu ne connais pas l'identité de la personne.\n\n" +
      "PRIORITÉ DES SOURCES :\n" +
      "1. Contenu live du site (priorité absolue pour dates et statuts)\n" +
      "2. Base de connaissance officielle (prix, descriptions)\n" +
      "3. RAG Supabase\n\n" +
      "STYLE :\n" +
      "• Professionnel, chaleureux, tutoiement. Max 1 émoji.\n" +
      "• Pas de syntaxe Markdown brute (#, ##, ---).\n" +
      "• **gras** pour titres, • pour listes, [texte](url) pour liens.\n" +
      "• Si info absente → ##INCONNU## en fin de réponse.\n" +
      escaladeNote + "\n\n" +
      "CONTEXTE :\n" + ctx;

    var msgsArr = history.slice(-6).map(function(m){ return { role: m.role, content: m.content }; });
    msgsArr.push({ role: "user", content: message });

    var llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 700, system: system, messages: msgsArr })
    });

    if (!llmRes.ok) {
      return res.status(200).json({ reply: "Problème technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id: sid });
    }

    var data  = await llmRes.json();
    var reply = data.content && data.content[0] ? data.content[0].text : null;
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    var isUnknown  = reply.includes("##INCONNU##");
    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown = isUnknown ? unknownCount + 1 : unknownCount;
    reply = reply.replace(/##INCONNU##|##ESCALADE##/g, "").trim();

    // Log Supabase (non bloquant)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        sb.from("chat_logs").insert({ session_id: sid, question: message, answer: reply, scrape_ok: !!liveContent }).then(function(){}).catch(function(){});
      } catch(e) {}
    }

    return res.status(200).json({ reply: reply, session_id: sid, unknown_count: newUnknown, escalade: isEscalade });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply: "Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id: sid });
  }
};
