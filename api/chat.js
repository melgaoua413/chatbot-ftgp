const { createClient } = require("@supabase/supabase-js");

const ALL_URLS = {
  "track-ia":          "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "scaleup":           "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "gen50tech":         "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "je-choisis":        "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "ville-de-demain":   "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "hiit":              "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "tremplin":          "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":           "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":        "https://www.frenchtech-grandparis.com/programmes",
  "partenaires-publics":"https://www.frenchtech-grandparis.com/partenaires/les-partenaires-publics",
  "partenaires-prives": "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives",
  "evenements":        "https://www.frenchtech-grandparis.com/evenements",
  "blog":              "https://www.frenchtech-grandparis.com/blog",
  "qui-sommes-nous":   "https://www.frenchtech-grandparis.com/qui-sommes-nous",
  "contact":           "https://www.frenchtech-grandparis.com/contact",
  "adhesion":          "https://www.frenchtech-grandparis.com/adhesion",
  "accueil":           "https://www.frenchtech-grandparis.com"
};

// Détection rapide SANS LLM — regex simple
function detectPages(q) {
  q = q.toLowerCase();
  var p = [];
  if (/track.?ia|intelligence.?artif|cartographie.?ia|masterclass.?ia/.test(q)) p.push("track-ia");
  if (/scaleup|scale.?up|excellence/.test(q)) p.push("scaleup");
  if (/gen50|50.?ans|senior|agisme|charte.?50/.test(q)) p.push("gen50tech");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(q)) p.push("je-choisis");
  if (/ville.?demain|smart.?city|collectivit|metropole/.test(q)) p.push("ville-de-demain");
  if (/hiit|medtech|healthtech|medical|clinique|sante.?innov/.test(q)) p.push("hiit");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) p.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(q)) p.push("central");
  if (/programme|tous les|liste|accompagnement/.test(q)) p.push("programmes");
  if (/partenaire.?public|administration/.test(q)) p.push("partenaires-publics");
  if (/partenaire.?priv|sponsor/.test(q)) p.push("partenaires-prives");
  if (/evenement|event|soiree|agenda|date|calendrier|find.?your|networking|vivatech|salon/.test(q)) p.push("evenements");
  if (/blog|article|actu|news/.test(q)) p.push("blog");
  if (/qui.?sommes|equipe|histoire|mission/.test(q)) p.push("qui-sommes-nous");
  if (/contact|joindre|email/.test(q)) p.push("contact");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(q)) p.push("adhesion");
  if (p.length === 0) p.push("accueil");
  return p;
}

function getToday() {
  var n = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return days[n.getDay()]+" "+n.getDate()+" "+months[n.getMonth()]+" "+n.getFullYear()+" ("+n.toISOString().split("T")[0]+")";
}

// Scraping Jina avec timeout court
async function scrapePage(url) {
  try {
    var ctrl = new AbortController();
    var t = setTimeout(function(){ ctrl.abort(); }, 5000); // 5s max
    var res = await fetch("https://r.jina.ai/"+url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var txt = await res.text();
    return txt.length > 2500 ? txt.substring(0, 2500) : txt; // réduit pour aller plus vite
  } catch(e) { return null; }
}

// Embedding HF
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

// Hybrid search Supabase
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
    var today  = getToday();
    var pages  = detectPages(message);

    // Lance scraping + embedding EN PARALLÈLE (gain de temps majeur)
    var scrapePromise = (async function() {
      var results = [];
      var targets = pages.slice(0, 2); // max 2 pages
      var scraped = await Promise.all(targets.map(function(p) {
        return scrapePage(ALL_URLS[p]).then(function(c) {
          return c ? "=== "+ALL_URLS[p]+" ===\n"+c : null;
        });
      }));
      return scraped.filter(Boolean).join("\n\n");
    })();

    var embeddingPromise = getEmbedding(message);

    // Attend les deux en parallèle
    var results = await Promise.all([scrapePromise, embeddingPromise]);
    var liveContent = results[0];
    var embedding   = results[1];

    // RAG Supabase
    var ragContent = "";
    if (embedding) {
      var chunks = await hybridSearch(message, embedding);
      if (chunks.length > 0) {
        ragContent = chunks.map(function(c){ return c.content; }).join("\n\n");
      }
    }

    // Construit le contexte final
    var context = "";
    if (liveContent) context += "SITE FTGP (prioritaire, info à jour) :\n"+liveContent+"\n\n";
    if (ragContent)  context += "BASE DE CONNAISSANCE :\n"+ragContent;
    if (!context)    context  = "Aucun contenu trouvé.";

    // UN SEUL appel LLM — mistral-large pour la qualité
    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n"+
      "Aujourd'hui : "+today+"\n\n"+
      "RÈGLES :\n"+
      "• Réponds en français, de façon directe et startup-friendly. Tu tutoies.\n"+
      "• Utilise UNIQUEMENT le contexte fourni. Zéro invention.\n"+
      "• Les infos du site FTGP sont PRIORITAIRES sur la base de connaissance.\n"+
      "• Candidatures FERMÉES (date passée) → dis-le clairement, pas de lien d'inscription.\n"+
      "• Candidatures OUVERTES → donne les infos et le lien.\n"+
      "• Tu ne connais pas l'identité de la personne.\n"+
      "• Si info manquante → renvoie vers https://www.frenchtech-grandparis.com/contact\n"+
      "• Hors sujet FTGP → décline poliment.\n\n"+
      "STYLE :\n"+
      "• Réponses courtes et percutantes (3-5 phrases max sauf si question complexe).\n"+
      "• **Gras** pour les infos clés.\n"+
      "• Listes à puces pour 3+ éléments.\n"+
      "• Liens : [texte](url)\n"+
      "• CTA en fin si pertinent : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion)\n\n"+
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

    if (!llmRes.ok) return res.status(200).json({ reply: "Problème technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)" });

    var data = await llmRes.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    // Log async (ne bloque pas la réponse)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
        .from("chat_logs").insert({ session_id:sid, question:message, answer:reply })
        .catch(function(){});
    }

    return res.status(200).json({ reply:reply, session_id:sid });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply:"Erreur technique. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)", session_id:sid });
  }
};
