const { createClient } = require("@supabase/supabase-js");

// ─── TOUTES LES URLS DU SITE FTGP ─────────────────────────────────────────
const ALL_URLS = {
  "accueil":           "https://www.frenchtech-grandparis.com/",
  "track-ia":          "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "scaleup":           "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "gen50tech":         "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "je-choisis":        "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "ville-de-demain":   "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "hiit":              "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "tremplin":          "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":           "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":        "https://www.frenchtech-grandparis.com/programmes",
  "partenaires-publics": "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-publics",
  "partenaires-prives":  "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives",
  "perks":             "https://www.frenchtech-grandparis.com/partenaires/les-partenaires-prives?perks+disponible=PERKS+disponible",
  "evenements":        "https://www.frenchtech-grandparis.com/evenements",
  "blog":              "https://www.frenchtech-grandparis.com/blog",
  "qui-sommes-nous":   "https://www.frenchtech-grandparis.com/qui-sommes-nous",
  "contact":           "https://www.frenchtech-grandparis.com/contact",
  "adhesion":          "https://www.frenchtech-grandparis.com/adhesion"
};

// ─── DÉTECTION DES PAGES PERTINENTES ──────────────────────────────────────
function detectPages(query) {
  var q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var detected = [];

  if (/track.?ia|intelligence.?artif|cartographie.?ia|masterclass.?ia|feuillet.?ia|osez.?ia/.test(q)) detected.push("track-ia");
  if (/scaleup|scale.?up|excellence/.test(q)) detected.push("scaleup");
  if (/gen50|50.?ans|senior|agisme|charte.?50|inclusion.?generat/.test(q)) detected.push("gen50tech");
  if (/je.?choisis|reverse.?pitch|grand.?compte|achat.?startup/.test(q)) detected.push("je-choisis");
  if (/ville.?demain|smart.?city|collectivit|metropole|mobilite.?urban/.test(q)) detected.push("ville-de-demain");
  if (/hiit|medtech|healthtech|medical|clinique|sante.?innov/.test(q)) detected.push("hiit");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa|egalite.?chance/.test(q)) detected.push("tremplin");
  if (/central|service.?public|inpi|urssaf|office.?hours|administration/.test(q)) detected.push("central");
  if (/programme|tous les|liste.?programme|accompagnement/.test(q)) detected.push("programmes");
  if (/partenaire.?public|service.?public|administration.?partenaire/.test(q)) detected.push("partenaires-publics");
  if (/partenaire.?prive|sponsor|partner/.test(q)) detected.push("partenaires-prives");
  if (/perk|avantage|reduction|offre.?membre|bennefice/.test(q)) detected.push("perks");
  if (/evenement|event|soiree|agenda|date|prochaine|find.?your.?prospect|networking|vivatech|salon|conference|calendrier/.test(q)) detected.push("evenements");
  if (/blog|article|actualite|actu|news/.test(q)) detected.push("blog");
  if (/qui.?sommes|equipe|histoire|mission|ftgp|french.?tech.?grand.?paris/.test(q)) detected.push("qui-sommes-nous");
  if (/contact|joindre|email|telephone|ecrire/.test(q)) detected.push("contact");
  if (/adhesion|adherer|membre|rejoindre|tarif|prix|cout|inscription/.test(q)) detected.push("adhesion");

  // Si rien détecté → scrape l'accueil + programmes par défaut
  if (detected.length === 0) {
    detected.push("accueil");
    detected.push("programmes");
  }

  return detected;
}

// ─── DATE DU JOUR ──────────────────────────────────────────────────────────
function getToday() {
  var now = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return {
    full: days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear(),
    iso:  now.toISOString().split("T")[0]
  };
}

// ─── SCRAPING VIA JINA AI ──────────────────────────────────────────────────
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

// ─── EMBEDDING VIA HUGGING FACE ────────────────────────────────────────────
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
      for (var i = 0; i < data.length; i++)
        for (var j = 0; j < dim; j++) avg[j] += data[i][j] / data.length;
      return avg;
    }
    return data;
  } catch(e) { return null; }
}

// ─── HYBRID SEARCH SUPABASE ────────────────────────────────────────────────
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

// ─── HANDLER PRINCIPAL ─────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message = req.body && req.body.message;
  var sid     = (req.body && req.body.session_id) || ("anon-" + Date.now());
  var history = (req.body && req.body.history) || [];
  var apiKey  = process.env.MISTRAL_API_KEY;

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var today = getToday();
    var pages = detectPages(message);

    // 1 — RAG Supabase (contexte de base)
    var ragContext = "";
    var embedding = await getEmbedding(message);
    if (embedding) {
      var ragChunks = await hybridSearch(message, embedding);
      if (ragChunks.length > 0) {
        ragContext = "=== BASE RAG (info de référence) ===\n" +
          ragChunks.map(function(c) {
            return "[" + (c.metadata && c.metadata.title ? c.metadata.title : "FTGP") + "]\n" + c.content;
          }).join("\n\n");
      }
    }

    // 2 — Scraping live des pages pertinentes (PRIORITAIRE sur le RAG)
    var liveContext = "";
    for (var i = 0; i < Math.min(pages.length, 3); i++) {
      var url = ALL_URLS[pages[i]];
      if (!url) continue;
      var content = await scrapePage(url);
      if (content) {
        liveContext += "=== CONTENU LIVE : " + url + " ===\n" + content + "\n\n";
      }
    }

    // Le site est TOUJOURS prioritaire sur le RAG
    var combinedContext = "";
    if (liveContext) combinedContext += "⚡ INFORMATIONS DU SITE (PRIORITAIRES - source la plus récente) :\n" + liveContext;
    if (ragContext)  combinedContext += "\n📚 BASE DE CONNAISSANCE (référence complémentaire) :\n" + ragContext;
    if (!combinedContext) combinedContext = "Aucun contenu trouvé.";

    // 3 — Analyse intelligente avec conscience temporelle
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
            "RÈGLE ABSOLUE : Les informations du site (marquées PRIORITAIRES) sont TOUJOURS plus fiables que la base RAG.\n" +
            "En cas de contradiction → utilise TOUJOURS l'info du site.\n\n" +
            "Analyse et extrait les faits pertinents :\n" +
            "1. STATUT : candidatures/événements OUVERTS ou FERMÉS ?\n" +
            "   → Si date limite AVANT " + today.iso + " → FERMÉ\n" +
            "   → Si date limite APRÈS " + today.iso + " → OUVERT\n" +
            "2. Dates importantes (passées ou futures ?)\n" +
            "3. Conditions d'éligibilité\n" +
            "4. Liens utiles (seulement si ouvert)\n" +
            "5. Résumé factuel 5 points\n\n" +
            "Si aucune info pertinente → 'AUCUNE SOURCE PERTINENTE'\n\n" +
            "CONTENU :\n" + combinedContext
        }],
        max_tokens: 1000,
        temperature: 0
      })
    });

    var analysis = "AUCUNE SOURCE PERTINENTE";
    if (analysisRes.ok) {
      var ad = await analysisRes.json();
      analysis = ad.choices && ad.choices[0] && ad.choices[0].message
        ? ad.choices[0].message.content : analysis;
    }

    // 4 — Génération réponse finale
    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n" +
      "Aujourd'hui : " + today.full + "\n\n" +
      "RÈGLES ABSOLUES :\n" +
      "• Réponds UNIQUEMENT à partir de l'analyse fournie. ZÉRO invention.\n" +
      "• Si 'AUCUNE SOURCE PERTINENTE' → 'Je n'ai pas cette info, contacte l'équipe 👉 [ici](https://www.frenchtech-grandparis.com/contact)'\n" +
      "• Candidatures/événement FERMÉ → dis-le clairement, PAS de lien d'inscription.\n" +
      "• Candidatures/événement OUVERT → donne les infos et le lien.\n" +
      "• Tu ne connais PAS l'identité de la personne.\n" +
      "• Hors sujet FTGP → décline poliment.\n\n" +
      "STYLE : Dynamique, direct, startup-friendly. Tu tutoies.\n\n" +
      "MISE EN FORME :\n" +
      "• **Gras** pour les infos clés\n" +
      "• Listes à puces pour 3 éléments ou plus\n" +
      "• Liens cliquables : [texte](url)\n" +
      "• CTA en fin :\n" +
      "  👉 [Adhérer à la FTGP](https://www.frenchtech-grandparis.com/adhesion)\n" +
      "  ou 👉 [Contacter l'équipe](https://www.frenchtech-grandparis.com/contact)\n\n" +
      "ANALYSE VÉRIFIÉE :\n" + analysis;

    var msgs = history.slice(-6).map(function(m) {
      return { role: m.role, content: m.content };
    });
    msgs.push({ role: "user", content: message });

    var finalRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(msgs),
        max_tokens: 700,
        temperature: 0
      })
    });

    if (!finalRes.ok) {
      return res.status(200).json({ reply: "Problème technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)" });
    }

    var fd = await finalRes.json();
    var reply = fd.choices && fd.choices[0] && fd.choices[0].message
      ? fd.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. [Contacte-nous](https://www.frenchtech-grandparis.com/contact)";

    // Log Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb2 = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb2.from("chat_logs").insert({ session_id: sid, question: message, answer: reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply: reply, session_id: sid });

  } catch(err) {
    console.error("Error:", err);
    return res.status(200).json({
      reply: "Erreur technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)",
      session_id: sid
    });
  }
};
