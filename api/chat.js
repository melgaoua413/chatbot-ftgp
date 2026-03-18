const { createClient } = require("@supabase/supabase-js");

// ─── CACHE EN MÉMOIRE (1h) ─────────────────────────────────────────────────
var pageCache = {};
var CACHE_TTL = 60 * 60 * 1000; // 1 heure

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

// Scraping avec cache — si la page est en cache ET fraîche → retourne le cache immédiatement
async function scrapeWithCache(url) {
  var now = Date.now();
  if (pageCache[url] && (now - pageCache[url].time) < CACHE_TTL) {
    return pageCache[url].content; // Cache hit — instantané !
  }
  try {
    var ctrl = new AbortController();
    var t = setTimeout(function(){ ctrl.abort(); }, 6000);
    var res = await fetch("https://r.jina.ai/"+url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var txt = await res.text();
    var content = txt.length > 3000 ? txt.substring(0, 3000) : txt;
    pageCache[url] = { content: content, time: now }; // Stocke en cache
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

  var message = req.body && req.body.message;
  var sid     = (req.body && req.body.session_id) || ("anon-"+Date.now());
  var history = (req.body && req.body.history) || [];
  var apiKey  = process.env.MISTRAL_API_KEY;

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();
    var pages = detectPages(message);

    // Lance scraping + embedding EN PARALLÈLE
    var [liveContent, embedding] = await Promise.all([
      // Scrape max 2 pages en parallèle aussi
      Promise.all(pages.slice(0,2).map(function(p) {
        return scrapeWithCache(ALL_URLS[p]).then(function(c) {
          return c ? "=== "+ALL_URLS[p]+" ===\n"+c : null;
        });
      })).then(function(r){ return r.filter(Boolean).join("\n\n"); }),
      getEmbedding(message)
    ]);

    // RAG Supabase
    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks.length > 0) ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
    }

    var context = "";
    if (liveContent) context += "SITE FTGP (prioritaire) :\n"+liveContent+"\n\n";
    if (ragContent)  context += "BASE RAG :\n"+ragContent;
    if (!context)    context  = "Aucun contenu trouvé.";

    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP). Aujourd'hui : "+today+"\n\n"+
      "RÈGLES ABSOLUES :\n"+
      "• Réponds en français, direct, startup-friendly, tu tutoies.\n"+
      "• Utilise UNIQUEMENT le contexte. ZÉRO invention.\n"+
      "• Site FTGP = prioritaire sur RAG.\n"+
      "• Date passée = candidatures FERMÉES. Ne donne pas de lien d'inscription si fermé.\n"+
      "• Info manquante → https://www.frenchtech-grandparis.com/contact\n"+
      "• Hors FTGP → décline.\n"+
      "• Tu ne connais pas l'identité de la personne.\n\n"+
      "FORMAT :\n"+
      "• Court et percutant (3-4 phrases max sauf si complexe).\n"+
      "• **Gras** pour les infos clés.\n"+
      "• Listes à puces pour 3+ éléments.\n"+
      "• Liens cliquables : [texte](url)\n"+
      "• CTA final si pertinent : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion)\n\n"+
      "CONTEXTE :\n"+context;

    var msgs = history.slice(-6).map(function(m){ return {role:m.role,content:m.content}; });
    msgs.push({role:"user",content:message});

    var llmRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{role:"system",content:systemPrompt}].concat(msgs),
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!llmRes.ok) return res.status(200).json({ reply:"Problème technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)" });

    var data = await llmRes.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    // Log non-bloquant
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        sb.from("chat_logs").insert({ session_id:sid, question:message, answer:reply });
      } catch(e) { console.error("Supabase log error:", e); }
    }

    return res.status(200).json({ reply:reply, session_id:sid });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
