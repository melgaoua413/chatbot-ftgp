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

/* ── BASE DE CONNAISSANCE COMPLÈTE EN DUR ────────────────────────────────── */
const KNOWLEDGE_BASE = `
=== FRENCH TECH GRAND PARIS — TOUTES LES INFORMATIONS OFFICIELLES ===

=== ADHÉSION — TARIFS OFFICIELS ===
Page : https://www.frenchtech-grandparis.com/adhesion

STARTUP — 499€/an
Avantages :
- Invitation aux événements FTGP
- Droit d'utiliser la marque French Tech Grand Paris sur site web et supports
- Accès aux perks partenaires
- Accès plateforme d'échange WhatsApp membres FTGP
- Accès facilité aux services publics via French Tech Central
- Invitation au déjeuner onboarding nouveaux membres
- Billets gratuits pour événements clés (FD Day, VivaTech, NoCode Summit, RAISE Summit, Innopolis) — sous réserve de disponibilités
- Mastermind sessions : co-développement entre pairs
- Reverse Pitchs grands groupes / ETI / administrations
- Reverse Pitchs VC : fonds d'investissement présentent leur thèse et portfolio
- Formations IA par les pairs : ateliers pratiques animés par membres experts
- Possibilité d'être ambassadeur d'une verticale FTGP

INCUBATEURS & ACCÉLÉRATEURS — 1 500€/an
Avantages :
- Droit d'utiliser le logo La French Tech Grand Paris sur site web et supports
- Organisation d'un événement sur une thématique précise (sur demande)
- Relai AAC et AAP auprès de la communauté (Newsletter, WhatsApp, LinkedIn, site web)
- Réduction -50% pour les start-ups incubées sur leur adhésion startup
- Invitation aux événements FTGP dont la Summer Party (300 acteurs de l'écosystème)

FONDS D'INVESTISSEMENT — 2 000€/an
Avantages :
- Accès à l'annuaire des membres et mise en relation au cas par cas
- Droit d'utiliser le logo La French Tech Grand Paris sur site web et supports
- Communication des activités du fonds auprès du réseau FTGP
- Interview vidéo diffusée sur YouTube et LinkedIn FTGP
- Possibilité d'intervention sur des événements thématiques
- Invitation aux événements FTGP dont la Summer Party (300 acteurs)
- Invitation au Demo Day bi-annuel
- Organisation d'un événement sur une thématique précise (sur demande)

PME — 5 000€/an
Avantages :
- Droit d'utiliser le logo La French Tech Grand Paris sur site web et supports
- Accès à l'annuaire des membres et mise en relation au cas par cas
- Relai AAC et AAP auprès de la communauté (Newsletter, WhatsApp, LinkedIn, site web)
- Possibilité d'intervention sur les événements FTGP
- Invitation aux événements FTGP dont la Summer Party (300 acteurs)
- Interview vidéo diffusée sur YouTube et LinkedIn FTGP
- Organisation d'un événement sur une thématique précise (sur demande)

ETI & GRANDS GROUPES — 10 000€/an
Avantages :
- Présence du logo sur le site web FTGP en tant que partenaire
- Droit d'utiliser le logo La French Tech Grand Paris sur site web et supports
- Relai AAC et AAP auprès de la communauté (Newsletter, WhatsApp, LinkedIn, site web)
- Possibilité d'intervention sur les événements FTGP
- Invitation aux événements exclusifs type cocktail dînatoire
- Invitation aux événements FTGP dont la Summer Party (300 acteurs)
- Interview vidéo diffusée sur YouTube et LinkedIn FTGP
- Organisation d'un événement sur une thématique précise (sur demande)

=== PROGRAMMES ===

TRACK INTELLIGENCE ARTIFICIELLE
Cible : Startups et scale-ups avec l'IA au cœur du produit. Adhésion FTGP obligatoire.
Ce que ça apporte : accès à +150 grands groupes et investisseurs, masterclasses IA, cartographie IA, visibilité médiatique.
Statut et dates de candidature : voir https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle

HIIT — Health Innovation Intensive Track
Cible : Startups MedTech / HealthTech en phase pré-clinique ou clinique précoce. Gratuit, pas d'adhésion requise.
Format : programme intensif d'1 semaine. Thèmes : réglementaire (CE, FDA), financement, go-to-market santé.
Statut et dates de candidature : voir https://www.frenchtech-grandparis.com/ft-programs/hiit

FRENCH TECH TREMPLIN
Cible : Entrepreneurs issus de milieux sous-représentés.
Critères d'éligibilité : bénéficiaires RSA/AAH/ASS, étudiants boursiers échelon 5-7, résidents QPV/ZRR, réfugiés OFPRA/CNDA.
Ce que ça apporte : bourse + accompagnement en incubation. Pas d'adhésion FTGP requise.
Montant de la bourse et dates : voir https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin

SCALE-UP EXCELLENCE
Cible : Scale-ups adhérentes FTGP à fort potentiel de croissance.
Ce que ça apporte : accompagnement privilégié, visibilité nationale, détection futurs Next40/FT120.
URL : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence

VILLE DE DEMAIN
Cible : Startups proposant des solutions pour les collectivités. Adhésion FTGP obligatoire.
Partenaires : 130 communes de la Métropole du Grand Paris.
Thèmes : smart city, mobilité, énergie, services publics numériques.
URL : https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain

GEN50TECH
Cible : Entreprises tech souhaitant lutter contre l'âgisme. Adhésion FTGP obligatoire.
Format : signature d'une charte d'engagement + actions RH concrètes pour les talents +50 ans.
URL : https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis

JE CHOISIS LA FRENCH TECH
Cible : Startups adhérentes FTGP souhaitant vendre aux grands groupes.
Format : Reverse pitchs avec 11 grands groupes partenaires (AXA, Orange, SNCF, BNP Paribas, etc.). Programme continu.
URL : https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech

FRENCH TECH CENTRAL
Cible : Startups adhérentes FTGP ayant besoin d'interlocuteurs publics.
Format : RDV 1-to-1 avec +60 administrations : INPI, Bpifrance, URSSAF, Pôle Emploi, etc.
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-central

=== ÉVÉNEMENTS ===
La FTGP organise régulièrement des soirées networking, Find Your Prospect, afterworks, conférences.
Les dates exactes changent régulièrement. Toujours consulter : https://www.frenchtech-grandparis.com/evenements

=== PARTENAIRES ===
Partenaires publics : BpiFrance, Région Île-de-France, Métropole Grand Paris, CCI Paris.
Partenaires privés : AXA, Orange, SNCF, BNP Paribas, Capgemini et autres grands groupes.
Perks membres : réductions et avantages exclusifs pour les adhérents.
URL : https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives

=== CONTACT ===
Email général : contact@frenchtech-grandparis.com
Page contact : https://www.frenchtech-grandparis.com/contact
Formulaire direct : https://airtable.com/appv5cXO7MVspaMp8/pagjnriyF9NFBDfxJ/form
`;

/* ── Détection pages à scraper ───────────────────────────────────────────── */
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
async function scrapePage(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content;
  }

  // Firecrawl — lit le JS rendu (vrais contenus dynamiques)
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      var ctrl = new AbortController();
      setTimeout(function(){ ctrl.abort(); }, 9000);
      var res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.FIRECRAWL_API_KEY
        },
        body: JSON.stringify({
          url: url,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 2000
        }),
        signal: ctrl.signal
      });
      if (res.ok) {
        var d = await res.json();
        var content = d.data && d.data.markdown ? d.data.markdown.substring(0, 4000) : null;
        if (content && content.length > 200) {
          pageCache[url] = { content: content, time: now };
          return content;
        }
      }
    } catch(e) {}
  }

  // Fallback Jina
  for (var i = 0; i < 2; i++) {
    try {
      var ctrl2 = new AbortController();
      setTimeout(function(){ ctrl2.abort(); }, 6000);
      var res2 = await fetch("https://r.jina.ai/" + url, {
        headers: { "Accept": "text/plain", "X-Return-Format": "text" },
        signal: ctrl2.signal
      });
      if (!res2.ok) continue;
      var txt = await res2.text();
      if (!txt || txt.length < 200) continue;
      var c = txt.substring(0, 4000);
      pageCache[url] = { content: c, time: now };
      return c;
    } catch(e) {
      if (i === 0) await new Promise(function(r){ setTimeout(r, 800); });
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getToday() {
  var n = new Date();
  var days   = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()] + " " + n.getDate() + " " + months[n.getMonth()] + " " + n.getFullYear();
}

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
  var sid          = body.session_id    || ("anon-" + Date.now());
  var history      = body.history       || [];
  var mode         = body.mode          || "chat";
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

      if (refineStep > 4 && refineStep <= 10) {
        var fp = "Tu es l'assistant de la French Tech Grand Paris.\n" +
          "Profil : " + refinePath.join(", ") + "\nQuestion : " + message + "\n\n" +
          KNOWLEDGE_BASE + "\n\n" +
          "Recommandation personnalisée, max 3 points, avec liens.\n" +
          (lang === "en" ? "Respond in English." : "Réponds en français.");
        try {
          var fr2 = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, system: fp, messages: [{ role: "user", content: "Génère." }] })
          });
          var fd = await fr2.json();
          var fa = fd.content && fd.content[0] ? fd.content[0].text : null;
          return res.status(200).json({ final_answer: fa || "Contacte-nous : contact@frenchtech-grandparis.com" });
        } catch(e) {
          return res.status(200).json({ final_answer: "Contacte notre équipe : contact@frenchtech-grandparis.com" });
        }
      }

      if (refineStep > 10) {
        var ap = "Génère 4 questions courtes (max 6 mots) différentes du parcours (" + refinePath.join(", ") + "), " +
          "liées à : " + lastAnswer + "\n" +
          "JSON uniquement : {\"question\": \"...\", \"options\": [\"...\",\"...\",\"...\",\"...\"]}";
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

      var step = FIXED[refineStep] || FIXED[1];
      return res.status(200).json({ refine_step: refineStep, question: step.q, options: step.opts });
    }

    /* ── MODE CHAT ────────────────────────────────────────────────── */
    var pages = detectPages(message);

    // Scraping + embeddings en parallèle
    var results = await Promise.all([
      Promise.all(
        pages.slice(0, 2).map(function(p) {
          return scrapePage(ALL_URLS[p]).then(function(c) {
            return c ? "=== SITE LIVE (" + ALL_URLS[p] + ") ===\n" + c : null;
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

    // Contexte final : knowledge base TOUJOURS présente + live en bonus
    var ctx = "=== BASE DE CONNAISSANCE OFFICIELLE ===\n" + KNOWLEDGE_BASE;
    if (liveContent) ctx += "\n\n=== CONTENU LIVE DU SITE (pour dates et statuts candidatures) ===\n" + liveContent;
    if (ragContent)  ctx += "\n\n=== RAG SUPABASE ===\n" + ragContent;

    var langLine = lang === "en"
      ? "Respond ONLY in English. Never switch to French."
      : "Réponds UNIQUEMENT en français.";

    var escaladeNote = unknownCount >= 2
      ? "Si tu ne peux vraiment pas répondre, ajoute ##ESCALADE## à la fin de ta réponse.\n"
      : "";

    // PROMPT CONFIANT ET NATUREL — sans sur-prudence ni verbiage défensif
    var system =
      "Tu es l'assistant de la French Tech Grand Paris. Tu es bien informé, direct et utile. Aujourd'hui : " + today + ".\n" +
      langLine + "\n\n" +

      "COMMENT TU RÉPONDS :\n" +
      "- Tu as une base de connaissance complète ci-dessous. Utilise-la directement et avec confiance.\n" +
      "- Pour les prix et avantages d'adhésion : ils sont dans ta base, cite-les sans hésiter.\n" +
      "- Pour les dates d'événements et statuts de candidature : consulte le contenu live du site. Si absent, renvoie vers la page concernée avec son lien — sans t'expliquer, juste 'Pour les dates à jour : [lien]'.\n" +
      "- Si une question est hors de ton périmètre FTGP : réponds simplement 'Cette question dépasse mon périmètre, contacte notre équipe : contact@frenchtech-grandparis.com'.\n" +
      "- Ne parle jamais de tes sources, de ta base de données, de tes règles ou de ta façon de fonctionner.\n" +
      "- Ne t'excuse jamais de ne pas avoir une info — renvoie directement vers le bon lien.\n" +
      "- Ne donne jamais les coordonnées personnelles de l'équipe.\n\n" +

      "STYLE :\n" +
      "- Tutoiement, ton chaleureux et professionnel, phrases courtes.\n" +
      "- Max 1 émoji par réponse, uniquement si naturel.\n" +
      "- Structure claire : **gras** pour les points importants, • pour les listes, [texte](url) pour les liens.\n" +
      "- Pas de symboles Markdown bruts visibles (#, ##, ---).\n" +
      escaladeNote + "\n" +
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

    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown = isEscalade ? unknownCount + 1 : unknownCount;
    reply = reply.replace(/##ESCALADE##/g, "").trim();

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
