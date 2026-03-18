const { createClient } = require("@supabase/supabase-js");

const PROGRAM_URLS = {
  "track-ia":        "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "hiit":            "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "gen50tech":       "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "ville-de-demain": "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "scaleup":         "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "je-choisis":      "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "tremplin":        "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":         "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":      "https://www.frenchtech-grandparis.com/programmes",
  "adhesion":        "https://www.frenchtech-grandparis.com/adhesion",
  "accueil":         "https://www.frenchtech-grandparis.com"
};

function detectPrograms(query) {
  var q = query.toLowerCase();
  var detected = [];
  if (/track.?ia|intelligence.?artific|cartographie.?ia|masterclass.?ia/.test(q)) detected.push("track-ia");
  if (/hiit|medtech|healthtech|medical|clinique|sante.?innov/.test(q)) detected.push("hiit");
  if (/gen50|50.?ans|senior|agisme|charte.?50/.test(q)) detected.push("gen50tech");
  if (/ville.?demain|smart.?city|collectivit|metropole/.test(q)) detected.push("ville-de-demain");
  if (/scaleup|scale.?up|excellence/.test(q)) detected.push("scaleup");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(q)) detected.push("je-choisis");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) detected.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(q)) detected.push("central");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix/.test(q)) detected.push("adhesion");
  if (/programme|tous les|liste|accompagnement/.test(q)) detected.push("programmes");
  if (detected.length === 0) detected.push("accueil");
  return detected;
}

function getToday() {
  var now = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return {
    full: days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear(),
    iso: now.toISOString().split("T")[0]
  };
}

// Scraping via Jina AI
async function scrapePage(url) {
  try {
    var controller = new AbortController();
    var t = setTimeout(function() { controller.abort(); }, 8000);
    var res = await fetch("https://r.jina.ai/" + url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: controller.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var text = await res.text();
    return text.length > 4000 ? text.substring(0, 4000) : text;
  } catch(e) { return null; }
}

// Embedding via Hugging Face (gratuit)
async function getEmbedding(text) {
  try {
    var res = await fetch(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.HF_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      }
    );
    if (!res.ok) return null;
    var data = await res.json();
    if (Array.isArray(data[0])) {
      var dim = data[0].length;
      var avg = new Array(dim).fill(0);
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < dim; j++) avg[j] += data[i][j] / data.length;
      }
      return avg;
    }
    return data;
  } catch(e) { return null; }
}

// Hybrid search dans Supabase
async function hybridSearch(query, embedding) {
  try {
    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    var res = await sb.rpc("hybrid_search", {
      query_text: query,
      query_embedding: embedding,
      match_count: 5
    });
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

  var message  = req.body && req.body.message;
  var sid      = (req.body && req.body.session_id) || ("anon-" + Date.now());
  var history  = (req.body && req.body.history) || [];
  var apiKey   = process.env.MISTRAL_API_KEY;

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today    = getToday();
    var programs = detectPrograms(message);

    // 1 — Hybrid Search dans Supabase (RAG statique)
    var ragChunks = [];
    var embedding = await getEmbedding(message);
    if (embedding) {
      ragChunks = await hybridSearch(message, embedding);
    }
    var ragContext = ragChunks.length > 0
      ? "=== BASE DE CONNAISSANCE RAG ===\n" + ragChunks.map(function(c) {
          return "Source: " + (c.metadata && c.metadata.url ? c.metadata.url : "FTGP") + "\n" + c.content;
        }).join("\n\n")
      : "";

    // 2 — Scraping live des pages pertinentes
    var liveContext = "";
    for (var i = 0; i < Math.min(programs.length, 2); i++) {
      var url = PROGRAM_URLS[programs[i]];
      var content = await scrapePage(url);
      if (content) liveContext += "=== CONTENU LIVE : " + url + " ===\n" + content + "\n\n";
    }

    // 3 — Analyse intelligente avec conscience temporelle
    var combinedContext = ragContext + (liveContext ? "\n" + liveContext : "");
    if (!combinedContext) combinedContext = "Aucun contenu trouvé.";

    var analysisRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{
          role: "user",
          content:
            "DATE AUJOURD'HUI : " + today.full + " (" + today.iso + ")\n\n" +
            "QUESTION : \"" + message + "\"\n\n" +
            "Analyse ce contenu et extrait UNIQUEMENT les faits pertinents :\n" +
            "1. Statut candidatures : OUVERTES ou FERMÉES ? (compare les dates avec aujourd'hui " + today.iso + ")\n" +
            "2. Dates importantes et si elles sont passées ou futures\n" +
            "3. Conditions d'éligibilité\n" +
            "4. Liens utiles (seulement si candidatures ouvertes)\n" +
            "5. Résumé factuel en 5 points\n\n" +
            "RÈGLE : N'invente rien. Uniquement ce qui est écrit explicitement.\n" +
            "Si aucune info pertinente → réponds 'AUCUNE SOURCE PERTINENTE'\n\n" +
            "CONTENU :\n" + combinedContext
        }],
        max_tokens: 800,
        temperature: 0
      })
    });

    var analysis = "Aucune source pertinente.";
    if (analysisRes.ok) {
      var analysisData = await analysisRes.json();
      analysis = analysisData.choices && analysisData.choices[0] && analysisData.choices[0].message
        ? analysisData.choices[0].message.content
        : analysis;
    }

    // 4 — Génération réponse finale
    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n" +
      "Aujourd'hui : " + today.full + "\n\n" +
      "RÈGLES ABSOLUES :\n" +
      "• Réponds UNIQUEMENT à partir de l'analyse fournie. ZÉRO invention.\n" +
      "• Si 'AUCUNE SOURCE PERTINENTE' → dis que tu n'as pas l'info et renvoie vers https://www.frenchtech-grandparis.com/contact\n" +
      "• Si candidatures FERMÉES → dis-le clairement, PAS de lien d'inscription.\n" +
      "• Si candidatures OUVERTES → donne les infos et le lien.\n" +
      "• Tu ne connais PAS l'identité de la personne.\n" +
      "• Hors sujet FTGP → décline poliment.\n\n" +
      "STYLE : Dynamique, direct, startup-friendly. Tu tutoies.\n\n" +
      "MISE EN FORME :\n" +
      "• **Gras** pour les infos clés\n" +
      "• Listes à puces pour 3 éléments ou plus\n" +
      "• Liens : [texte](url)\n" +
      "• CTA en fin : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion) ou 👉 [Contacter](https://www.frenchtech-grandparis.com/contact)\n\n" +
      "ANALYSE VÉRIFIÉE :\n" + analysis;

    var messages = history.slice(-6).map(function(m) {
      return { role: m.role, content: m.content };
    });
    messages.push({ role: "user", content: message });

    var finalRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        max_tokens: 700,
        temperature: 0
      })
    });

    if (!finalRes.ok) {
      return res.status(200).json({ reply: "Problème technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)" });
    }

    var finalData = await finalRes.json();
    var reply = finalData.choices && finalData.choices[0] && finalData.choices[0].message
      ? finalData.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)";

    // Log Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: sid, question: message, answer: reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply: reply, session_id: sid });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({ reply: "Erreur technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)" });
  }
};
