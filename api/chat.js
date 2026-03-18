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

/* ── RAG STATIQUE INTÉGRÉ ────────────────────────────────────────────────── */
const STATIC_RAG = `
=== FRENCH TECH GRAND PARIS — BASE DE CONNAISSANCE PERMANENTE ===

--- ADHÉSION ---
L'adhésion FTGP est obligatoire pour accéder à la plupart des programmes.
Tarifs annuels :
• Startup (CA < 2M€) : 600€/an
• Scale-up (CA 2-10M€) : 1 200€/an
• ETI / Grand groupe (CA > 10M€) : 3 000€/an
Lien : https://www.frenchtech-grandparis.com/adhesion
Contact général : contact@frenchtech-grandparis.com

--- TRACK INTELLIGENCE ARTIFICIELLE ---
Pour : Startups et scale-ups avec l'IA au cœur du produit. Adhésion FTGP obligatoire.
Objectifs : Accès à +150 grands groupes, masterclasses IA, visibilité médiatique, cartographie IA.
Pas de bourse. Programme d'accélération business.
URL : https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle

--- HIIT (Health Innovation Intensive Track) ---
Pour : Startups MedTech / HealthTech en phase pré-clinique ou clinique précoce.
Format : Programme intensif d'1 semaine. 100% gratuit (pas d'adhésion requise).
Thèmes : Réglementaire (CE, FDA), financement, go-to-market santé.
Candidatures : dates variables — toujours vérifier sur le site.
URL : https://www.frenchtech-grandparis.com/ft-programs/hiit

--- FRENCH TECH TREMPLIN ---
Pour : Entrepreneurs issus de milieux sous-représentés.
Critères éligibilité : bénéficiaires RSA/AAH/ASS, étudiants boursiers échelon 5-7, résidents QPV/ZRR, réfugiés OFPRA/CNDA.
Bourse : jusqu'à 22 900€ + accompagnement incubation.
Pas d'adhésion FTGP requise.
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin

--- SCALE-UP EXCELLENCE ---
Pour : Scale-ups adhérentes FTGP à fort potentiel de croissance.
Objectif : Détection des futurs Next40/FT120. Accompagnement privilégié, visibilité nationale.
URL : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence

--- VILLE DE DEMAIN ---
Pour : Startups proposant des solutions pour les collectivités. Adhésion FTGP obligatoire.
Partenaires : 130 communes de la Métropole du Grand Paris.
Thèmes : Smart city, mobilité, énergie, services publics numériques.
URL : https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain

--- GEN50TECH ---
Pour : Entreprises tech souhaitant lutter contre l'âgisme. Adhésion FTGP obligatoire.
Format : Signature d'une charte d'engagement + actions RH concrètes.
Cible : Talents tech de +50 ans.
URL : https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis

--- JE CHOISIS LA FRENCH TECH ---
Pour : Startups adhérentes FTGP cherchant à vendre aux grands groupes.
Format : Reverse pitchs avec 11 grands groupes partenaires (AXA, Orange, SNCF, BNP, etc.).
Programme continu, pas de date limite fixe.
URL : https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech

--- FRENCH TECH CENTRAL ---
Pour : Startups adhérentes FTGP ayant besoin d'interlocuteurs publics.
Format : RDV 1-to-1 avec +60 administrations : INPI, Bpifrance, URSSAF, Pôle Emploi, etc.
URL : https://www.frenchtech-grandparis.com/ft-programs/french-tech-central

--- FRENCH TECH VISA ---
Pour : Talents et fondateurs étrangers souhaitant s'installer en France.
Deux types : "Founder" (créateurs de startup) et "Employee" (salariés de startup).
Démarches via le site officiel French Tech.
URL : https://www.frenchtech-grandparis.com

--- FRENCH TECH 2030 ---
Programme national d'investissement pour startups deeptech et industrielles à fort impact.
Géré par Bpifrance. Sélection par cohortes.
URL : https://www.frenchtech-grandparis.com

--- NEXT 40 / FRENCH TECH 120 ---
Label national pour les 120 startups françaises à plus fort potentiel.
Sélection annuelle par le gouvernement. Avantages : accès facilité aux grands comptes, services publics, investisseurs.
URL : https://www.frenchtech-grandparis.com

--- ÉVÉNEMENTS ---
La FTGP organise régulièrement : soirées networking, Find Your Prospect, afterworks, conférences thématiques.
Pour les dates exactes et actuelles : https://www.frenchtech-grandparis.com/evenements
Ces dates changent régulièrement — toujours vérifier sur la page événements.

--- PARTENAIRES ---
Partenaires publics : BpiFrance, Région Île-de-France, Métropole Grand Paris, CCI Paris.
Partenaires privés : grands groupes comme AXA, Orange, SNCF, BNP Paribas, Capgemini.
Perks membres : réductions et avantages exclusifs pour les adhérents.
URL partenaires : https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives

--- CONTACT ET ÉQUIPE ---
Contact général : contact@frenchtech-grandparis.com
Site : https://www.frenchtech-grandparis.com/contact
Formulaire : https://airtable.com/appv5cXO7MVspaMp8/pagjnriyF9NFBDfxJ/form
NE JAMAIS communiquer les coordonnées personnelles des membres de l'équipe.
`;

/* ── Détection pages ─────────────────────────────────────────────────────── */
function detectPages(q) {
  var q2 = q.toLowerCase();
  var qn = q2.normalize ? q2.normalize("NFD").replace(/[\u0300-\u036f]/g,"") : q2;
  var p  = [];
  if (/track.?ia|intelligence.?artif|cartographie.?ia|masterclass/.test(qn)) p.push("track-ia");
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
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(qn)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(qn)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(qn)) p.push("contact");
  if (/partenaire.?public/.test(qn)) p.push("partenaires-publics");
  if (/partenaire.?priv|perk/.test(qn)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

/* ── Scraping Jina avec retry ────────────────────────────────────────────── */
async function scrapeWithRetry(url, retries) {
  retries = retries || 2;
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content;
  }
  for (var i = 0; i < retries; i++) {
    try {
      var ctrl = new AbortController();
      var t    = setTimeout(function(){ ctrl.abort(); }, 6000);
      var res  = await fetch("https://r.jina.ai/" + url, {
        headers: { "Accept": "text/plain", "X-Return-Format": "text" },
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!res.ok) continue;
      var txt = await res.text();
      if (!txt || txt.length < 100) continue; // contenu vide = retry
      var content = txt.length > 4000 ? txt.substring(0, 4000) : txt;
      pageCache[url] = { content: content, time: now };
      return content;
    } catch(e) {
      if (i < retries - 1) await new Promise(function(r){ setTimeout(r, 800); }); // attend 800ms avant retry
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
        1:  { q: "Quel est ton profil ?",             opts: ["Startup / Scale-up","Grand groupe / ETI","Investisseur","Porteur de projet"] },
        2:  { q: "Quel est ton objectif principal ?", opts: ["Trouver des financements","Accéder à des clients","Être accompagné","Rejoindre un programme"] },
        3:  { q: "Quel est ton secteur ?",            opts: ["Intelligence Artificielle","HealthTech / MedTech","GreenTech / CleanTech","Autre tech"] },
        4:  { q: "Quel est ton stade ?",              opts: ["Idée / Pre-seed","Seed / Série A","Série B+","Déjà établi"] }
      };

      // Réponse finale après 4 étapes fixes
      if (refineStep > 4 && refineStep <= 10) {
        var pathSummary = refinePath.join(", ");
        var fp =
          "Tu es un expert relation client de la French Tech Grand Paris.\n"+
          "Profil utilisateur : "+pathSummary+"\n"+
          "Question initiale : "+message+"\n\n"+
          "BASE DE CONNAISSANCE :\n"+STATIC_RAG+"\n\n"+
          "Fournis une recommandation personnalisée, précise et actionnable.\n"+
          "Ton : professionnel, chaleureux, startup-friendly. Tutoiement.\n"+
          "Max 3 recommandations concrètes avec liens exacts FTGP.\n"+
          "Termine par un CTA vers https://www.frenchtech-grandparis.com/adhesion si pertinent.\n"+
          (lang==="en" ? "Respond in English." : "Réponds en français.");
        try {
          var fr2 = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:600, system:fp, messages:[{role:"user",content:"Génère la recommandation personnalisée."}] })
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
          "Tu es expert relation client FTGP.\n"+
          "Question : "+message+"\n"+
          "Dernière réponse donnée : "+lastAnswer+"\n"+
          "Parcours précédent : "+refinePath.join(", ")+"\n\n"+
          "Génère 4 nouvelles questions courtes (max 6 mots) DIFFÉRENTES du parcours précédent,\n"+
          "directement liées au contenu de la dernière réponse.\n"+
          "Réponds UNIQUEMENT avec ce JSON (rien d'autre) :\n"+
          "{\"question\": \"...\", \"options\": [\"...\",\"...\",\"...\",\"...\"]}";
        try {
          var ar = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:200, system:ap, messages:[{role:"user",content:"Génère les questions."}] })
          });
          var ad = await ar.json();
          var at = ad.content && ad.content[0] ? ad.content[0].text.replace(/```json|```/g,"").trim() : null;
          var parsed = at ? JSON.parse(at) : null;
          if (parsed && parsed.question && parsed.options) {
            return res.status(200).json({ refine_step: refineStep, question: parsed.question, options: parsed.options });
          }
        } catch(e) {}
        return res.status(200).json({ refine_step: refineStep, question: "Qu'est-ce qui te manque exactement ?", options: ["Plus de détails sur un programme","Les conditions d'accès","Les prochaines dates","Parler à quelqu'un"] });
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
        pages.slice(0,2).map(function(p) {
          return scrapeWithRetry(ALL_URLS[p]).then(function(c) {
            return c ? "=== "+ALL_URLS[p]+" ===\n"+c : null;
          });
        })
      ).then(function(r){ return r.filter(Boolean).join("\n\n"); }),
      getEmbedding(message)
    ]);

    var liveContent = results[0];
    var embedding   = results[1];

    // RAG Supabase
    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks && chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    // Construction du contexte : statique (toujours) + live (si dispo) + RAG Supabase (si dispo)
    var ctx = "=== BASE PERMANENTE (toujours fiable) ===\n" + STATIC_RAG;
    if (liveContent) ctx += "\n\n=== SITE EN DIRECT (prioritaire pour dates/statuts) ===\n" + liveContent;
    if (ragContent)  ctx += "\n\n=== RAG SUPABASE ===\n" + ragContent;

    var langLine = lang === "en"
      ? "Respond ONLY in English. Never use French."
      : "Réponds UNIQUEMENT en français.";

    var escaladeNote = unknownCount >= 2
      ? "\nATTENTION : L'utilisateur a déjà eu des réponses insuffisantes. Oriente-le vers l'équipe et ajoute ##ESCALADE## à la fin."
      : "";

    var system =
      "Tu es l'assistant officiel de la French Tech Grand Paris. Aujourd'hui : "+today+"\n"+
      langLine+"\n\n"+
      "RÈGLES ABSOLUES :\n"+
      "• Utilise UNIQUEMENT le contexte fourni ci-dessous. ZÉRO invention.\n"+
      "• Le site en direct est prioritaire sur la base permanente pour les dates et statuts.\n"+
      "• Si une date est passée → dis clairement que c'est fermé.\n"+
      "• Tu ne connais PAS l'identité de la personne. Ne l'invente jamais.\n"+
      "• Question hors FTGP → décline poliment et recentre.\n"+
      "• Si l'info est absente du contexte → dis-le et renvoie vers https://www.frenchtech-grandparis.com/contact — ne jamais inventer.\n"+
      "• Ne jamais donner les coordonnées personnelles de l'équipe. Contact = contact@frenchtech-grandparis.com uniquement.\n\n"+
      "STYLE :\n"+
      "• Professionnel, chaleureux, startup-friendly. Tutoiement.\n"+
      "• Zéro émoji superflu. Max 1 si vraiment pertinent.\n"+
      "• Pas de syntaxe Markdown brute visible (pas de # ## ### ---).\n"+
      "• Structure : **gras** pour titres, • pour listes, sauts de ligne pour aérer.\n"+
      "• Liens cliquables : [texte](url)\n"+
      "• Si tu ne sais pas → ##INCONNU## en fin de réponse.\n"+
      escaladeNote+"\n\n"+
      "CONTEXTE :\n"+ctx;

    var msgs = history.slice(-6).map(function(m){ return {role:m.role, content:m.content}; });
    msgs.push({role:"user", content:message});

    var llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:700, system:system, messages:msgs })
    });

    if (!llmRes.ok) {
      var errText = await llmRes.text();
      console.error("Anthropic error:", llmRes.status, errText);
      return res.status(200).json({ reply:"Problème technique momentané. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
    }

    var data  = await llmRes.json();
    var reply = data.content && data.content[0] ? data.content[0].text : null;
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    var isUnknown  = reply.includes("##INCONNU##");
    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown = isUnknown ? unknownCount + 1 : unknownCount;
    reply = reply.replace(/##INCONNU##|##ESCALADE##/g,"").trim();

    // Log Supabase (optionnel, non bloquant)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        sb.from("chat_logs").insert({ session_id:sid, question:message, answer:reply }).then(function(){}).catch(function(){});
      } catch(e) {}
    }

    return res.status(200).json({ reply:reply, session_id:sid, unknown_count:newUnknown, escalade:isEscalade });

  } catch(err) {
    console.error("Handler error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
