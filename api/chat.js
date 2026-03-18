const { createClient } = require("@supabase/supabase-js");

// ─── CACHE MÉMOIRE 1H ──────────────────────────────────────────────────────
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
  q = q.toLowerCase();
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
  if (/evenement|event|soiree|agenda|date|calendrier|find.?your|networking|vivatech/.test(q)) p.push("evenements");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(q)) p.push("adhesion");
  if (/qui.?sommes|equipe|histoire|mission/.test(q)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(q)) p.push("contact");
  if (/partenaire.?public/.test(q)) p.push("partenaires-publics");
  if (/partenaire.?priv/.test(q)) p.push("partenaires-prives");
  if (p.length === 0) p.push("accueil");
  return p;
}

function getToday() {
  var n = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()]+" "+n.getDate()+" "+months[n.getMonth()]+" "+n.getFullYear()+" ("+n.toISOString().split("T")[0]+")";
}

async function scrapeWithCache(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content;
  }
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

// ─── APPEL CLAUDE HAIKU ────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages) {
  var res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: messages
    })
  });
  if (!res.ok) {
    var err = await res.text();
    throw new Error("Claude error: "+err);
  }
  var data = await res.json();
  return data.content && data.content[0] && data.content[0].text ? data.content[0].text : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message  = req.body && req.body.message;
  var sid      = (req.body && req.body.session_id) || ("anon-"+Date.now());
  var history  = (req.body && req.body.history) || [];
  var mode     = (req.body && req.body.mode) || "chat"; // "chat" ou "refine"
  var context  = (req.body && req.body.context) || "";  // pour le mode refine

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();

    // ─── MODE REFINE : génère 4 amorces intelligentes ──────────────────────
    if (mode === "refine") {
      var refinePrompt =
        "Tu es l'assistant de la French Tech Grand Paris.\n"+
        "La personne a posé cette question : \""+message+"\"\n"+
        "Elle n'est pas satisfaite de cette réponse : \""+context+"\"\n\n"+
        "Génère exactement 4 questions ou amorces TRÈS courtes (max 6 mots) pour l'aider à préciser sa demande.\n"+
        "Sois intelligent — analyse ce qui manque dans la question et propose des précisions pertinentes.\n"+
        "Réponds UNIQUEMENT avec un JSON array de 4 strings, rien d'autre.\n"+
        "Exemple: [\"Ma startup est en B2B\",\"Je cherche du financement\",\"Mon secteur est HealthTech\",\"Je suis en pre-seed\"]";

      try {
        var refineRes = await callClaude(refinePrompt, [{role:"user",content:"Génère les 4 amorces."}]);
        var clean = refineRes.replace(/```json|```/g,"").trim();
        var opts = JSON.parse(clean);
        return res.status(200).json({ refinements: opts });
      } catch(e) {
        return res.status(200).json({ refinements: ["Mon secteur est différent","Je cherche du financement","Ma startup est early stage","Je veux plus de détails"] });
      }
    }

    // ─── MODE CHAT NORMAL ──────────────────────────────────────────────────
    var pages = detectPages(message);

    // Scraping + embedding EN PARALLÈLE
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

    // RAG
    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    var ctx = "";
    if (liveContent) ctx += "SITE FTGP (prioritaire, info à jour) :\n"+liveContent+"\n\n";
    if (ragContent)  ctx += "BASE RAG :\n"+ragContent;
    if (!ctx)        ctx  = "Aucun contenu trouvé.";

    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP). Aujourd'hui : "+today+"\n\n"+
      "RÈGLES :\n"+
      "• Réponds en français, direct, startup-friendly, tu tutoies.\n"+
      "• Utilise UNIQUEMENT le contexte. ZÉRO invention.\n"+
      "• Site FTGP = prioritaire. Date passée = candidatures FERMÉES.\n"+
      "• Info manquante → https://www.frenchtech-grandparis.com/contact\n"+
      "• Hors FTGP → décline poliment.\n"+
      "• Tu ne connais pas l'identité de la personne.\n\n"+
      "FORMAT :\n"+
      "• Court et percutant (3-4 phrases max sauf si complexe).\n"+
      "• **Gras** pour les infos clés.\n"+
      "• Listes à puces pour 3+ éléments.\n"+
      "• Liens : [texte](url)\n"+
      "• CTA si pertinent : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion)\n\n"+
      "CONTEXTE :\n"+ctx;

    var msgs = history.slice(-6).map(function(m){ return {role:m.role,content:m.content}; });
    msgs.push({role:"user",content:message});

    var reply = await callClaude(systemPrompt, msgs);
    if (!reply) reply = "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    // Log Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id:sid, question:message, answer:reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply:reply, session_id:sid });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
