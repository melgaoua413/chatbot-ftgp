const { createClient } = require("@supabase/supabase-js");

var pageCache = {};
var CACHE_TTL = 60 * 60 * 1000;

const ALL_URLS = {
  "track-ia":           "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "scaleup":            "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "gen50tech":          "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "je-choisis":         "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "ville-de-demain":    "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "hiit":               "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "tremplin":           "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":            "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":         "https://www.frenchtech-grandparis.com/programmes",
  "evenements":         "https://www.frenchtech-grandparis.com/evenements",
  "adhesion":           "https://www.frenchtech-grandparis.com/adhesion",
  "qui-sommes-nous":    "https://www.frenchtech-grandparis.com/qui-sommes-nous",
  "contact":            "https://www.frenchtech-grandparis.com/contact",
  "partenaires-publics":"https://www.frenchtech-grandparis.com/partenaires/les-partenaires-publics",
  "partenaires-prives": "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives",
  "accueil":            "https://www.frenchtech-grandparis.com"
};

function detectPages(q) {
  var q2 = q.toLowerCase();
  q = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var p = [];
  if (/track.?ia|intelligence.?artif|cartographie.?ia|masterclass/.test(q)) p.push("track-ia");
  if (/scaleup|scale.?up|excellence/.test(q)) p.push("scaleup");
  if (/gen50|50.?ans|senior|agisme/.test(q)) p.push("gen50tech");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(q)) p.push("je-choisis");
  if (/ville.?demain|smart.?city|collectivit/.test(q)) p.push("ville-de-demain");
  if (/hiit|medtech|healthtech|clinique|sante.?innov/.test(q)) p.push("hiit");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) p.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(q)) p.push("central");
  if (/programme|tous les|liste|accompagnement/.test(q)) p.push("programmes");
  if (/evenement|event|soiree|agenda|date|calendrier|find.?your|networking|prochains/.test(q) || /\u00e9v\u00e9nement|\u00e9v\u00e8nement|soir\u00e9e/.test(q2)) p.push("evenements");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(q)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(q)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(q)) p.push("contact");
  if (/partenaire.?public/.test(q)) p.push("partenaires-publics");
  if (/partenaire.?priv/.test(q)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

function detectLanguage(text) {
  var en = /(\b(the|is|are|was|were|what|how|when|where|why|who|can|could|would|should|have|has|had|will|do|does|did|my|your|our|their|this|that|and|or|but|for|with|from|about)\b)/i.test(text);
  var fr = /[àâäéèêëîïôùûüç]|(\b(je|tu|il|nous|vous|ils|est|les|des|une|pour|avec|dans|sur|que|qui|pas|plus|bien|aussi|mais|donc|car)\b)/i.test(text);
  if (en && !fr) return "en";
  return "fr";
}

function getToday() {
  var n = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()]+" "+n.getDate()+" "+months[n.getMonth()]+" "+n.getFullYear()+" ("+n.toISOString().split("T")[0]+")";
}

async function scrapeWithCache(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) return pageCache[url].content;
  try {
    var ctrl = new AbortController();
    var t = setTimeout(function(){ ctrl.abort(); }, 5000);
    var res = await fetch("https://r.jina.ai/"+url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var txt = await res.text();
    var content = txt.length > 3000 ? txt.substring(0, 3000) : txt;
    pageCache[url] = { content: content, time: now };
    return content;
  } catch(e) { return null; }
}

async function getEmbedding(text) {
  try {
    var res = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
      { method:"POST", headers:{"Authorization":"Bearer "+process.env.HF_TOKEN,"Content-Type":"application/json"}, body:JSON.stringify({inputs:text}) }
    );
    if (!res.ok) return null;
    var data = await res.json();
    if (Array.isArray(data[0])) {
      var avg = new Array(data[0].length).fill(0);
      for (var i=0;i<data.length;i++) for (var j=0;j<data[0].length;j++) avg[j]+=data[i][j]/data.length;
      return avg;
    }
    return data;
  } catch(e) { return null; }
}

async function hybridSearch(query, embedding) {
  try {
    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    var res = await sb.rpc("hybrid_search", { query_text:query, query_embedding:embedding, match_count:3 });
    if (res.error || !res.data) return [];
    return res.data;
  } catch(e) { return []; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message      = req.body && req.body.message;
  var sid          = (req.body && req.body.session_id) || ("anon-"+Date.now());
  var history      = (req.body && req.body.history) || [];
  var mode         = (req.body && req.body.mode) || "chat";
  var unknownCount = (req.body && req.body.unknown_count) || 0;
  var refineStep   = (req.body && req.body.refine_step) || 1;
  var refinePath   = (req.body && req.body.refine_path) || [];
  var lastAnswer   = (req.body && req.body.last_answer) || "";

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();
    var lang  = detectLanguage(message);

    // ─── MODE REFINE ADAPTATIF ─────────────────────────────────────────────
    if (mode === "refine") {

      // Étapes fixes pour le 1er passage (step 1-4)
      var FIXED_STEPS = {
        1: { q: "Quel est ton profil ?", opts: ["Startup / Scale-up", "Grand groupe / ETI", "Investisseur", "Porteur de projet"] },
        2: { q: "Quel est ton objectif principal ?", opts: ["Trouver des financements", "Accéder à des clients", "Être accompagné", "Rejoindre un programme"] },
        3: { q: "Quel est ton secteur ?", opts: ["Intelligence Artificielle", "HealthTech / MedTech", "GreenTech / CleanTech", "Autre tech"] },
        4: { q: "Quel est ton stade ?", opts: ["Idée / Pre-seed", "Seed / Série A", "Série B+", "Déjà établi"] }
      };

      // Après 4 étapes → réponse finale personnalisée
      if (refineStep > 4) {
        var pathSummary = refinePath.join(", ");
        var finalPrompt =
          "Tu es un expert relation client de la French Tech Grand Paris.\n"+
          "Profil de l'utilisateur : "+pathSummary+"\n"+
          "Question initiale : \""+message+"\"\n\n"+
          "Fournis une recommandation personnalisée, précise et directement actionnable.\n"+
          "Ton : professionnel, chaleureux, sans émoji superflu.\n"+
          "Structure : 2-3 recommandations concrètes avec les liens exacts vers les programmes FTGP adaptés.\n"+
          "CTA final : https://www.frenchtech-grandparis.com/adhesion";
        try {
          var rfr = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:500, system:finalPrompt, messages:[{role:"user",content:"Génère la recommandation."}] })
          });
          var rfd = await rfr.json();
          var fa = rfd.content && rfd.content[0] ? rfd.content[0].text : null;
          return res.status(200).json({ final_answer: fa || "Contacte-nous : contact@frenchtech-grandparis.com" });
        } catch(e) {
          return res.status(200).json({ final_answer: "Contacte notre équipe : contact@frenchtech-grandparis.com" });
        }
      }

      // 2ème passage (refineStep > 10 = signal de 2ème dislike) → questions adaptatives basées sur la dernière réponse
      if (refineStep > 10) {
        var adaptPrompt =
          "Tu es un expert relation client de la French Tech Grand Paris.\n"+
          "L'utilisateur n'est toujours pas satisfait.\n"+
          "Sa question : \""+message+"\"\n"+
          "La dernière réponse donnée : \""+lastAnswer+"\"\n"+
          "Son parcours précédent : "+refinePath.join(", ")+"\n\n"+
          "Analyse ce qui manque dans la réponse et génère 4 nouvelles questions très courtes (max 6 mots)\n"+
          "pour préciser sa demande. Ces questions doivent être DIFFÉRENTES des étapes précédentes\n"+
          "et directement liées au contenu de la dernière réponse.\n"+
          "Réponds UNIQUEMENT avec un JSON : {\"question\": \"...\", \"options\": [\"...\",\"...\",\"...\",\"...\"]}\n"+
          "Rien d'autre, pas de markdown.";
        try {
          var ar = await fetch("https://api.anthropic.com/v1/messages", {
            method:"POST",
            headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
            body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:200, system:adaptPrompt, messages:[{role:"user",content:"Génère les questions adaptatives."}] })
          });
          var ad = await ar.json();
          var at = ad.content && ad.content[0] ? ad.content[0].text.replace(/```json|```/g,"").trim() : null;
          var parsed = at ? JSON.parse(at) : null;
          if (parsed && parsed.question && parsed.options) {
            return res.status(200).json({ refine_step: refineStep, question: parsed.question, options: parsed.options, adaptive: true });
          }
        } catch(e) {}
        // Fallback
        return res.status(200).json({ refine_step: refineStep, question: "Qu'est-ce qui te manque ?", options: ["Plus de détails", "Un autre programme", "Les conditions d'accès", "Les prochaines dates"], adaptive: true });
      }

      // 1er passage normal
      var step = FIXED_STEPS[refineStep] || FIXED_STEPS[1];
      return res.status(200).json({ refine_step: refineStep, question: step.q, options: step.opts });
    }

    // ─── MODE CHAT ────────────────────────────────────────────────────────
    var pages = detectPages(message);

    var results = await Promise.all([
      Promise.all(pages.slice(0,2).map(function(p) {
        return scrapeWithCache(ALL_URLS[p]).then(function(c) {
          return c ? "=== "+ALL_URLS[p]+" ===\n"+c : null;
        });
      })).then(function(r){ return r.filter(Boolean).join("\n\n"); }),
      getEmbedding(message)
    ]);

    var liveContent = results[0];
    var embedding   = results[1];

    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    var ctx = "";
    if (liveContent) ctx += "SITE FTGP (prioritaire) :\n"+liveContent+"\n\n";
    if (ragContent)  ctx += "BASE RAG :\n"+ragContent;
    if (!ctx)        ctx  = "Aucun contenu trouvé.";

    var langInstruction = lang === "en" ? "Respond in English." : "Réponds en français.";
    var escaladeInstruction = unknownCount >= 2
      ? "\nESCALADE : oriente l'utilisateur vers l'équipe et termine par ##ESCALADE##"
      : "";

    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP). Aujourd'hui : "+today+"\n"+
      langInstruction+"\n\n"+
      "RÈGLES ABSOLUES :\n"+
      "• Utilise UNIQUEMENT le contexte fourni. ZÉRO invention.\n"+
      "• Site FTGP = prioritaire. Date passée = candidatures FERMÉES.\n"+
      "• Tu ne connais PAS l'identité de la personne.\n"+
      "• Hors FTGP → décline poliment.\n"+
      "• Si info manquante → https://www.frenchtech-grandparis.com/contact\n\n"+
      "PROTECTION DONNÉES :\n"+
      "• Ne donne JAMAIS les coordonnées personnelles de l'équipe.\n"+
      "• Contact → uniquement contact@frenchtech-grandparis.com\n\n"+
      "STYLE (EXPERT RELATION CLIENT) :\n"+
      "• Professionnel, chaleureux, startup-friendly. Tu tutoies.\n"+
      "• Zéro émoji superflu — max 1 par réponse si vraiment pertinent.\n"+
      "• Vocabulaire précis, concis, orienté valeur. Pas de langage enfantin.\n"+
      "• IMPORTANT : N'utilise JAMAIS la syntaxe Markdown brute dans tes réponses.\n"+
      "  Ne jamais écrire # ## ### --- *** au sens littéral.\n"+
      "  Pour structurer : utilise des sauts de ligne, des tirets •, et du **gras** uniquement.\n"+
      "• Structure visuelle : titres en **gras**, listes avec •, blocs séparés par sauts de ligne.\n"+
      "• IMPORTANT : tN'utilise JAMAIS l'abréviation FTGP. TOUJOURS dire French tech Grand Paris.\n"+
      "• Liens : [texte actionnable](url)\n"+
      "• CTA final si pertinent : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion)\n"+
      "• Si tu ne sais vraiment pas → ##INCONNU## à la fin.\n"+
      escaladeInstruction+"\n\n"+
      "CONTEXTE :\n"+ctx;

    var msgs = history.slice(-6).map(function(m){ return {role:m.role,content:m.content}; });
    msgs.push({role:"user",content:message});

    var llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:600, system:systemPrompt, messages:msgs })
    });

    if (!llmRes.ok) return res.status(200).json({ reply:"Problème technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });

    var data = await llmRes.json();
    var reply = data.content && data.content[0] ? data.content[0].text : null;
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    var isUnknown  = reply.includes("##INCONNU##");
    var isEscalade = reply.includes("##ESCALADE##");
    var newUnknown = isUnknown ? unknownCount+1 : unknownCount;
    reply = reply.replace(/##INCONNU##|##ESCALADE##/g,"").trim();

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id:sid, question:message, answer:reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply:reply, session_id:sid, unknown_count:newUnknown, escalade:isEscalade });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
