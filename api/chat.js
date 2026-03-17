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
  if (/track.?ia|intelligence.?artific|cartographie.?ia|masterclass.?ia|feuillet.?ia/.test(q)) detected.push("track-ia");
  if (/hiit|medtech|healthtech|medical|clinique|sante.?innov|health.?innov/.test(q)) detected.push("hiit");
  if (/gen50|50.?ans|senior|agisme|charte.?50|inclusion.?generat/.test(q)) detected.push("gen50tech");
  if (/ville.?demain|smart.?city|collectivit|metropole/.test(q)) detected.push("ville-de-demain");
  if (/scaleup|scale.?up|excellence/.test(q)) detected.push("scaleup-excellence");
  if (/je.?choisis|reverse.?pitch|grand.?compte|corporate/.test(q)) detected.push("je-choisis");
  if (/tremplin|diversit|bourse|boursier|qpv|rsa/.test(q)) detected.push("tremplin");
  if (/central|service.?public|inpi|urssaf|office.?hours/.test(q)) detected.push("central");
  if (/programme|tous les|liste|accompagnement|quels/.test(q)) detected.push("programmes");
  if (detected.length === 0) detected.push("accueil");
  return detected;
}

// Scraping propre : extrait uniquement le texte utile
async function scrapePage(url) {
  try {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 6000);
    var res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    var html = await res.text();

    // Supprime tout ce qui n'est pas du contenu utile
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

    // Garde les balises importantes pour la structure
    html = html
      .replace(/<h[1-6][^>]*>/gi, "\n## ")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/li>/gi, "")
      .replace(/<p[^>]*>/gi, "\n")
      .replace(/<br[^>]*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&eacute;/g, "é")
      .replace(/&egrave;/g, "è")
      .replace(/&agrave;/g, "à")
      .replace(/&#[0-9]+;/g, "")
      .replace(/\s{3,}/g, "\n\n")
      .trim();

    // Garde les 4000 premiers caractères (suffisant pour analyser)
    return html.length > 4000 ? html.substring(0, 4000) + "\n[...]" : html;
  } catch(e) {
    console.error("Scrape error " + url + ":", e.message);
    return null;
  }
}

var SYSTEM_PROMPT =
"Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n\n" +

"=== PROCESSUS OBLIGATOIRE AVANT CHAQUE RÉPONSE ===\n" +
"Tu DOIS suivre ces étapes dans l'ordre :\n" +
"1. LIS entièrement le contenu de la page fournie dans le contexte.\n" +
"2. IDENTIFIE les informations clés : dates, statut des candidatures (ouvertes/fermées), conditions, liens.\n" +
"3. VÉRIFIE : les candidatures sont-elles ouvertes ou fermées ? Y a-t-il une date limite ? Est-elle passée ?\n" +
"4. SEULEMENT APRÈS cette analyse → formule ta réponse.\n\n" +

"=== RÈGLES ANTI-HALLUCINATION (ABSOLUES) ===\n" +
"• Tu n'utilises QUE les informations présentes dans le contexte fourni.\n" +
"• Si les candidatures sont FERMÉES dans le contexte → tu le dis clairement, tu ne donnes PAS de lien d'inscription.\n" +
"• Si une date est passée → tu le signales clairement.\n" +
"• Si tu ne trouves pas l'info dans le contexte → tu dis 'Je n'ai pas cette information' et tu renvoies vers https://www.frenchtech-grandparis.com/contact\n" +
"• Tu ne connais PAS l'identité de la personne. Si on te demande son nom/poste → 'Je n'ai pas accès à ces informations.'\n" +
"• JAMAIS de suppositions. JAMAIS d'inventions.\n\n" +

"=== TON ET STYLE ===\n" +
"• Dynamique, direct, startup-friendly. Tu tutoies naturellement.\n" +
"• Phrases courtes et percutantes.\n" +
"• Hors périmètre FTGP → tu déclines poliment.\n\n" +

"=== MISE EN FORME ===\n" +
"• **Gras** pour les noms de programmes et infos importantes.\n" +
"• Listes à puces (•) pour 3 éléments ou plus.\n" +
"• Liens cliquables : [texte du lien](url)\n" +
"• Toujours un CTA en fin de réponse :\n" +
"  👉 [Adhérer à la FTGP](https://www.frenchtech-grandparis.com/adhesion)\n" +
"  ou 👉 [Contacter l'équipe](https://www.frenchtech-grandparis.com/contact)\n\n" +

"=== CONTEXTE LIVE DU SITE FTGP (analyse-le en profondeur) ===\n" +
"{context}";

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

    // Scrape en séquentiel pour éviter les timeouts
    for (var i = 0; i < Math.min(programs.length, 2); i++) {
      var url = PROGRAM_URLS[programs[i]];
      var content = await scrapePage(url);
      if (content) {
        scrapeResults.push("=== CONTENU DE LA PAGE : " + url + " ===\n" + content + "\n=== FIN DE LA PAGE ===");
      }
    }

    var context = scrapeResults.length > 0
      ? scrapeResults.join("\n\n")
      : "Aucun contenu récupéré depuis le site. Renvoie l'utilisateur vers https://www.frenchtech-grandparis.com/contact";

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
        max_tokens: 700,
        temperature: 0 // Zéro créativité = zéro hallucination
      })
    });

    if (!mistralRes.ok) {
      return res.status(200).json({ reply: "Problème technique momentané. Contacte-nous directement : [contact@frenchtechgrandparis.com](mailto:contact@frenchtechgrandparis.com)" });
    }

    var data = await mistralRes.json();
    var reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
      ? data.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)";

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: session_id, question: message, answer: reply });
      } catch(e) { console.error("Supabase:", e); }
    }

    return res.status(200).json({ reply: reply, session_id: session_id });

  } catch(error) {
    console.error("Handler error:", error);
    return res.status(200).json({ reply: "Erreur technique. Contacte-nous : [ici](https://www.frenchtech-grandparis.com/contact)" });
  }
};
