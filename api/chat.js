const { createClient } = require("@supabase/supabase-js");

const PROGRAM_URLS = {
  "track-ia": "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
  "hiit": "https://www.frenchtech-grandparis.com/ft-programs/hiit",
  "gen50tech": "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
  "ville-de-demain": "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
  "scaleup-excellence": "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
  "je-choisis": "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
  "tremplin": "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
  "central": "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
  "programmes": "https://www.frenchtech-grandparis.com/programmes",
  "accueil": "https://www.frenchtech-grandparis.com"
};

function detectPrograms(query) {
  var q = query.toLowerCase();
  var detected = [];
  if (/track.?ia|intelligence.?artific|cartographie.?ia|masterclass.?ia/.test(q)) detected.push("track-ia");
  if (/hiit|medtech|healthtech|medical|clinique|sante.?innov/.test(q)) detected.push("hiit");
  if (/gen50|50.?ans|senior|agisme|charte.?50/.test(q)) detected.push("gen50tech");
  if (/ville.?demain|smart.?city|collectivit|metropole/.test(q)) detected.push("ville-de-demain");
  if (/scaleup|scale.?up|excellence/.test(q)) detected.push("scaleup-excellence");
  if (/je.?choisis|reverse.?pitch|grand.?compte/.test(q)) detected.push("je-choisis");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) detected.push("tremplin");
  if (/central|service.?public|inpi|urssaf/.test(q)) detected.push("central");
  if (/programme|tous les|liste|accompagnement/.test(q)) detected.push("programmes");
  if (detected.length === 0) detected.push("accueil");
  return detected;
}

async function scrapePage(url) {
  try {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 5000);
    var res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FTGP-Bot/1.0)" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    var html = await res.text();
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
    return html.substring(0, 3000);
  } catch(e) {
    return null;
  }
}

var SYSTEM_PROMPT = "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n\n" +
"REGLES ABSOLUES :\n" +
"- Reponds UNIQUEMENT en francais.\n" +
"- Tu n'affirmes QUE ce qui est dans le contexte fourni. ZERO invention.\n" +
"- Si l'info n'est pas dans le contexte : dis-le et renvoie vers https://www.frenchtech-grandparis.com/contact\n" +
"- Tu ne connais pas l'identite de la personne qui te parle. Si on te demande son nom/poste : reponds que tu n'as pas acces a ces infos.\n" +
"- Tu vas toi-meme chercher les infos sur le site FTGP via le scraping. Tu donnes la reponse a jour directement.\n" +
"- Questions hors FTGP : decline poliment.\n\n" +
"TON STYLE :\n" +
"- Dynamique, direct, startup-friendly. Tu tutoies.\n" +
"- Phrases courtes. Verbes d'action.\n" +
"- Max 4 phrases sauf si question complexe.\n\n" +
"MISE EN FORME :\n" +
"- **Gras** pour noms de programmes et chiffres cles.\n" +
"- [texte](url) pour les liens.\n" +
"- Listes a puces pour 3 elements ou plus.\n" +
"- CTA en fin : [Adherer](https://www.frenchtech-grandparis.com/adhesion) ou [Nous contacter](https://www.frenchtech-grandparis.com/contact)\n\n" +
"CONTEXTE DU SITE FTGP :\n{context}";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message = req.body && req.body.message;
  var session_id = (req.body && req.body.session_id) || ("anon-" + Date.now());
  var history = (req.body && req.body.history) || [];

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    var programs = detectPrograms(message);
    var scrapeResults = [];
    
    for (var i = 0; i < Math.min(programs.length, 2); i++) {
      var content = await scrapePage(PROGRAM_URLS[programs[i]]);
      if (content) scrapeResults.push("=== " + PROGRAM_URLS[programs[i]] + " ===\n" + content);
    }

    var context = scrapeResults.length > 0 
      ? scrapeResults.join("\n\n") 
      : "Aucun contenu recupere. Renvoie vers https://www.frenchtech-grandparis.com/contact";

    var systemPrompt = SYSTEM_PROMPT.replace("{context}", context);

    var messages = [];
    var recent = history.slice(-6);
    for (var j = 0; j < recent.length; j++) {
      messages.push({ role: recent[j].role, content: recent[j].content });
    }
    messages.push({ role: "user", content: message });

    var mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.MISTRAL_API_KEY
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        max_tokens: 600,
        temperature: 0.2
      })
    });

    if (!mistralRes.ok) {
      return res.status(200).json({ reply: "Probleme technique. Contacte-nous : contact@frenchtechgrandparis.com" });
    }

    var data = await mistralRes.json();
    var reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
      ? data.choices[0].message.content
      : "Je n'ai pas pu generer de reponse. Contacte-nous : contact@frenchtechgrandparis.com";

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: session_id, question: message, answer: reply });
      } catch(e) {}
    }

    return res.status(200).json({ reply: reply, session_id: session_id });

  } catch(error) {
    console.error("Handler error:", error);
    return res.status(200).json({ reply: "Erreur technique. Contacte-nous : contact@frenchtechgrandparis.com" });
  }
};
