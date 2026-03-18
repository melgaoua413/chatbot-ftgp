const { createClient } = require("@supabase/supabase-js");

// ─── URLS DES PAGES FTGP ───────────────────────────────────────────────────
const PROGRAM_URLS = {
  "track-ia":          "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "hiit":              "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "gen50tech":         "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "ville-de-demain":   "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "scaleup":           "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "je-choisis":        "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "tremplin":          "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central":           "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes":        "https://www.frenchtech-grandparis.com/programmes",
  "adhesion":          "https://www.frenchtech-grandparis.com/adhesion",
  "accueil":           "https://www.frenchtech-grandparis.com"
};

// ─── DATE DU JOUR ──────────────────────────────────────────────────────────
function getToday() {
  var now = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return {
    full:  days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear(),
    day:   now.getDate(),
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    iso:   now.toISOString().split("T")[0]
  };
}

// ─── SCRAPING VIA JINA AI ──────────────────────────────────────────────────
async function scrapePage(url) {
  try {
    var controller = new AbortController();
    var t = setTimeout(function() { controller.abort(); }, 10000);
    var res = await fetch("https://r.jina.ai/" + url, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: controller.signal
    });
    clearTimeout(t);
    if (!res.ok) return null;
    var text = await res.text();
    return text.length > 5000 ? text.substring(0, 5000) + "\n[tronqué]" : text;
  } catch(e) {
    return null;
  }
}

// ─── ÉTAPE 1 : ROUTER — classe la question et choisit la source ─────────────
async function routeQuestion(question, apiKey, today) {
  var res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{
        role: "user",
        content:
          "Tu es un router. Aujourd'hui : " + today.full + ".\n" +
          "Analyse cette question et retourne UNIQUEMENT un JSON valide (aucun texte autour) :\n\n" +
          "Question : \"" + question + "\"\n\n" +
          "Retourne ce JSON :\n" +
          "{\n" +
          "  \"intent\": \"programme\" | \"adhesion\" | \"contact\" | \"hors_sujet\" | \"general\",\n" +
          "  \"programs\": [liste des programmes concernés parmi : track-ia, hiit, gen50tech, ville-de-demain, scaleup, je-choisis, tremplin, central, programmes, adhesion, accueil],\n" +
          "  \"needs_live_data\": true | false,\n" +
          "  \"can_answer\": true | false\n" +
          "}\n\n" +
          "Règles :\n" +
          "- needs_live_data = true si la question porte sur des dates, candidatures, événements, inscriptions.\n" +
          "- can_answer = false si la question est hors sujet FTGP ou sur l'identité de l'utilisateur.\n" +
          "- programs = [] si non applicable.\n" +
          "Retourne UNIQUEMENT le JSON, rien d'autre."
      }],
      max_tokens: 200,
      temperature: 0
    })
  });
  if (!res.ok) return { intent: "general", programs: ["accueil"], needs_live_data: true, can_answer: true };
  var data = await res.json();
  var text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "{}";
  try {
    // Nettoie les backticks éventuels
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch(e) {
    return { intent: "general", programs: ["accueil"], needs_live_data: true, can_answer: true };
  }
}

// ─── ÉTAPE 2 : RETRIEVAL — scrape les pages pertinentes ────────────────────
async function retrieveSources(programs) {
  var sources = [];
  var targets = programs.length > 0 ? programs : ["accueil"];
  for (var i = 0; i < Math.min(targets.length, 3); i++) {
    var url = PROGRAM_URLS[targets[i]];
    if (!url) continue;
    var content = await scrapePage(url);
    if (content) sources.push({ url: url, content: content });
  }
  return sources;
}

// ─── ÉTAPE 3 : ANALYSE — extrait les faits clés avec conscience temporelle ─
async function analyzeSources(sources, question, today, apiKey) {
  if (sources.length === 0) return null;
  var sourceText = sources.map(function(s) {
    return "=== SOURCE : " + s.url + " ===\n" + s.content + "\n=== FIN SOURCE ===";
  }).join("\n\n");

  var res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{
        role: "user",
        content:
          "DATE AUJOURD'HUI : " + today.full + " (iso: " + today.iso + ")\n\n" +
          "QUESTION POSÉE : \"" + question + "\"\n\n" +
          "Analyse ces sources et extrait UNIQUEMENT les faits pertinents pour répondre à la question.\n\n" +
          "Pour CHAQUE fait extrait :\n" +
          "1. Cite l'URL source exacte.\n" +
          "2. Cite l'extrait exact du texte source.\n" +
          "3. Indique si l'info est CERTAINE (écrit explicitement) ou INCERTAINE (déduit).\n\n" +
          "ANALYSE TEMPORELLE OBLIGATOIRE :\n" +
          "- Si une date est mentionnée, compare-la avec aujourd'hui (" + today.full + ").\n" +
          "- Une date limite AVANT " + today.iso + " = PASSÉE → candidatures/événement TERMINÉ.\n" +
          "- Une date limite APRÈS " + today.iso + " = FUTURE → candidatures/événement EN COURS.\n" +
          "- Si le mot 'fermées', 'closes', 'terminées' apparaît → candidatures FERMÉES.\n" +
          "- Si le mot 'ouvertes', 'postuler', 'candidater' apparaît → VÉRIFIE la date avant de conclure.\n\n" +
          "Si aucune information pertinente trouvée → réponds 'AUCUNE SOURCE PERTINENTE'.\n\n" +
          "SOURCES :\n" + sourceText
      }],
      max_tokens: 1200,
      temperature: 0
    })
  });
  if (!res.ok) return null;
  var data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
}

// ─── ÉTAPE 4 : GÉNÉRATION FINALE ───────────────────────────────────────────
async function generateAnswer(question, analysis, sources, history, today, apiKey, intent) {
  var sourceUrls = sources.map(function(s) { return s.url; }).join(", ");

  var systemPrompt =
    "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n" +
    "Aujourd'hui : " + today.full + ".\n\n" +

    "=== RÈGLES ABSOLUES ===\n" +
    "• Tu réponds UNIQUEMENT à partir de l'analyse fournie ci-dessous.\n" +
    "• Si l'analyse dit 'AUCUNE SOURCE PERTINENTE' → réponds : 'Je n'ai pas trouvé cette information sur le site FTGP. Contacte directement l'équipe 👉 [ici](https://www.frenchtech-grandparis.com/contact)'\n" +
    "• JAMAIS d'invention. JAMAIS de complétion avec ta connaissance générale.\n" +
    "• Si candidatures FERMÉES → dis-le clairement, AUCUN lien d'inscription.\n" +
    "• Si candidatures OUVERTES → donne les infos et le lien.\n" +
    "• Si tu n'es pas sûr → dis-le et renvoie vers le contact.\n" +
    "• Tu ne connais PAS l'identité de la personne. Si on demande son nom/poste → 'Je n'ai pas accès à ces informations.'\n" +
    "• Hors sujet FTGP → décline poliment.\n\n" +

    "=== STYLE ===\n" +
    "• Dynamique, direct, startup-friendly. Tu tutoies.\n" +
    "• Phrases courtes et percutantes.\n\n" +

    "=== MISE EN FORME ===\n" +
    "• **Gras** pour les infos clés.\n" +
    "• Listes à puces (•) pour 3 éléments ou plus.\n" +
    "• Liens : [texte](url)\n" +
    "• CTA en fin : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion) ou 👉 [Contacter l'équipe](https://www.frenchtech-grandparis.com/contact)\n\n" +

    "=== ANALYSE VÉRIFIÉE (base-toi UNIQUEMENT sur ça) ===\n" +
    (analysis || "Aucune source pertinente trouvée.") + "\n\n" +
    "Sources consultées : " + (sourceUrls || "aucune");

  var messages = history.slice(-6).map(function(m) {
    return { role: m.role, content: m.content };
  });
  messages.push({ role: "user", content: question });

  var res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{ role: "system", content: systemPrompt }].concat(messages),
      max_tokens: 700,
      temperature: 0
    })
  });

  if (!res.ok) return "Problème technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)";
  var data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : "Je n'ai pas pu générer de réponse. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)";
}

// ─── HANDLER PRINCIPAL ─────────────────────────────────────────────────────
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
    var today = getToday();

    // ÉTAPE 1 — Router
    var route = await routeQuestion(message, apiKey, today);

    // Si hors sujet → réponse immédiate
    if (!route.can_answer) {
      return res.status(200).json({
        reply: "Je suis uniquement formé sur les programmes et l'écosystème de la **French Tech Grand Paris**. Pour toute autre question, contacte l'équipe 👉 [ici](https://www.frenchtech-grandparis.com/contact)",
        session_id: sid
      });
    }

    // ÉTAPE 2 — Retrieval
    var sources = [];
    if (route.needs_live_data || route.intent === "programme") {
      sources = await retrieveSources(route.programs);
    }

    // ÉTAPE 3 — Analyse avec conscience temporelle
    var analysis = await analyzeSources(sources, message, today, apiKey);

    // ÉTAPE 4 — Génération finale
    var reply = await generateAnswer(message, analysis, sources, history, today, apiKey, route.intent);

    // Log Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: sid, question: message, answer: reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply: reply, session_id: sid });

  } catch(err) {
    console.error("Handler error:", err);
    return res.status(200).json({
      reply: "Erreur technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)",
      session_id: sid
    });
  }
};
