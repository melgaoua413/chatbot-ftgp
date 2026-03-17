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

// Scraping via Jina AI — lit le contenu JS rendu, retourne du Markdown propre
async function scrapePage(url) {
  try {
    var jinaUrl = "https://r.jina.ai/" + url;
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 10000);
    var res = await fetch(jinaUrl, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    var text = await res.text();
    return text.length > 4000 ? text.substring(0, 4000) + "\n[...]" : text;
  } catch(e) {
    console.error("Jina error " + url + ":", e.message);
    return null;
  }
}

// Génère un contexte temporel complet
function getTemporalContext() {
  var now = new Date();
  var days = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  var months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return {
    full: days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear(),
    day: now.getDate(),
    month: now.getMonth() + 1,
    monthName: months[now.getMonth()],
    year: now.getFullYear(),
    iso: now.toISOString().split("T")[0]
  };
}

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
    var date = getTemporalContext();
    var programs = detectPrograms(message);
    var scrapeResults = [];

    for (var i = 0; i < Math.min(programs.length, 2); i++) {
      var url = PROGRAM_URLS[programs[i]];
      var content = await scrapePage(url);
      if (content) scrapeResults.push("=== PAGE : " + url + " ===\n" + content + "\n=== FIN ===");
    }

    var rawContext = scrapeResults.length > 0 ? scrapeResults.join("\n\n") : null;

    // PASSE 1 — Analyse intelligente du contenu + conscience temporelle
    var analyzedContext = "";
    if (rawContext) {
      var analyzeRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.MISTRAL_API_KEY
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{
            role: "user",
            content:
              "=== DATE D'AUJOURD'HUI ===\n" +
              "Nous sommes le " + date.full + " (année " + date.year + ", mois " + date.month + ").\n\n" +
              "=== TA MISSION ===\n" +
              "Analyse ce contenu de page web et réponds à ces questions avec une précision absolue :\n\n" +
              "1. STATUT DES CANDIDATURES :\n" +
              "   - Cherche tous les mots liés aux candidatures : 'ouvertes', 'fermées', 'closes', 'terminées', 'prochainement', 'postuler', 'candidater'.\n" +
              "   - Si une DATE LIMITE est mentionnée : compare-la avec aujourd'hui (" + date.full + ").\n" +
              "   - Si la date limite est AVANT " + date.full + " → candidatures FERMÉES.\n" +
              "   - Si la date limite est APRÈS " + date.full + " → candidatures OUVERTES.\n" +
              "   - Conclusion obligatoire : OUVERTES ou FERMÉES ?\n\n" +
              "2. DATES IMPORTANTES : Liste toutes les dates mentionnées et précise si elles sont passées ou à venir par rapport à aujourd'hui.\n\n" +
              "3. CONDITIONS D'ÉLIGIBILITÉ : Qui peut candidater ? Quels critères ?\n\n" +
              "4. LIENS : Y a-t-il des liens d'inscription ? (Ne les inclure QUE si candidatures ouvertes)\n\n" +
              "5. RÉSUMÉ FACTUEL : 5-10 points clés du programme.\n\n" +
              "RÈGLE ABSOLUE : N'invente rien. Ne suppose rien. Uniquement ce qui est EXPLICITEMENT dans le texte.\n\n" +
              "=== CONTENU DE LA PAGE ===\n" + rawContext
          }],
          max_tokens: 1000,
          temperature: 0
        })
      });

      if (analyzeRes.ok) {
        var analyzeData = await analyzeRes.json();
        analyzedContext = analyzeData.choices && analyzeData.choices[0] && analyzeData.choices[0].message
          ? analyzeData.choices[0].message.content
          : rawContext;
      } else {
        analyzedContext = rawContext;
      }
    } else {
      analyzedContext = "Aucun contenu récupéré. Renvoie vers https://www.frenchtech-grandparis.com/contact";
    }

    // PASSE 2 — Génère la réponse finale
    var systemPrompt =
      "Tu es l'assistant officiel de la French Tech Grand Paris (FTGP).\n" +
      "Aujourd'hui nous sommes le " + date.full + ".\n\n" +
      "=== RÈGLES ABSOLUES ===\n" +
      "• Tu n'utilises QUE les informations de l'analyse fournie ci-dessous.\n" +
      "• ZERO invention. ZERO supposition.\n" +
      "• Si candidatures FERMÉES → tu le dis clairement, tu ne donnes PAS de lien d'inscription.\n" +
      "• Si candidatures OUVERTES → tu donnes les infos et le lien.\n" +
      "• Si tu ne sais pas → renvoie vers https://www.frenchtech-grandparis.com/contact\n" +
      "• Tu ne connais pas l'identité de la personne. Si on te demande son nom/poste → 'Je n'ai pas accès à ces informations.'\n" +
      "• Questions hors FTGP → décline poliment.\n\n" +
      "=== STYLE ===\n" +
      "• Dynamique, direct, startup-friendly. Tu tutoies.\n" +
      "• Phrases courtes et percutantes.\n\n" +
      "=== MISE EN FORME ===\n" +
      "• **Gras** pour les infos importantes.\n" +
      "• Listes à puces pour 3 éléments ou plus.\n" +
      "• Liens cliquables : [texte](url)\n" +
      "• CTA en fin : 👉 [Adhérer](https://www.frenchtech-grandparis.com/adhesion) ou 👉 [Contacter l'équipe](https://www.frenchtech-grandparis.com/contact)\n\n" +
      "=== ANALYSE DE LA PAGE (BASE-TOI UNIQUEMENT SUR ÇA) ===\n" +
      analyzedContext;

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
        model: "mistral-large-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        max_tokens: 700,
        temperature: 0
      })
    });

    if (!mistralRes.ok) {
      return res.status(200).json({ reply: "Problème technique. Contacte-nous : [contact@frenchtechgrandparis.com](mailto:contact@frenchtechgrandparis.com)" });
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
