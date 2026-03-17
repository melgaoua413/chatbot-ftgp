const { createClient } = require("@supabase/supabase-js");

// Map programme → URL FTGP
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
};

// Détecte quel(s) programme(s) est concerné par la question
function detectPrograms(query) {
  var q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var detected = [];
  if (/track.?ia|track.?intelligence|intelligence.?artific|cartographie.?ia|feuillet.?ia|masterclass.?ia|bizdev.?ia|osez.?ia/.test(q)) detected.push("track-ia");
  if (/hiit|medtech|healthtech|medical|clinique|dispositif.?med|sante.?innov|health.?innov/.test(q)) detected.push("hiit");
  if (/gen50|50.?ans|senior|agisme|charte.?50|inclusion.?generat/.test(q)) detected.push("gen50tech");
  if (/ville.?demain|smart.?city|collectivit|metropole.?grand.?paris|mobilite.?urban|logistique.?urban|batiment|amenagement|economie.?circulaire/.test(q)) detected.push("ville-de-demain");
  if (/scaleup|scale.?up|excellence|nouveau.?programme/.test(q)) detected.push("scaleup-excellence");
  if (/je.?choisis|achat.?startup|reverse.?pitch|grand.?compte|corporate|axa|sncf|edf/.test(q)) detected.push("je-choisis");
  if (/tremplin|diversit|egalit|bourse|incub|boursier|qpv|rsa/.test(q)) detected.push("tremplin");
  if (/central|service.?public|inpi|urssaf|office.?hours|administration/.test(q)) detected.push("central");
  if (/programme|tous les|liste|quels.?programme|offre/.test(q)) detected.push("programmes");
  return detected;
}

// Scrape une page FTGP et retourne le texte nettoyé
async function scrapePage(url) {
  try {
    var res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FTGP-Bot/1.0)" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    var html = await res.text();

    // Supprimer scripts, styles, nav, footer
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#[0-9]+;/g, "")
      .trim();

    // Limiter à 3000 caractères pour ne pas exploser le contexte
    return html.length > 3000 ? html.substring(0, 3000) + "..." : html;
  } catch (e) {
    console.error("Scrape error for " + url + ":", e.message);
    return null;
  }
}

// RAG statique de fallback
const STATIC_RAG = {
  "presentation": {
    keywords: ["qui", "quoi", "presentation", "french tech", "ftgp", "association", "territoire", "grand paris", "cest quoi"],
    content: `French Tech Grand Paris : association loi 1901, Communauté labellisée French Tech. Accompagne les startups et PME innovantes du Grand Paris (Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, Essonne, Val-d'Oise, Seine-et-Marne, Yvelines). Site : https://www.frenchtech-grandparis.com | Contact : contact@frenchtechgrandparis.com`
  },
  "adhesion": {
    keywords: ["adhesion", "adherer", "membre", "inscription", "rejoindre", "prix", "tarif", "cout", "avantage", "perk"],
    content: `Adhésion FTGP annuelle. Accès à tous les programmes, événements exclusifs, réseau membres, visibilité écosystème. Perks : Optivalue.ai (3 mois offerts, 3000€), BPI France (30min expert), Pennylane (2 mois offerts), Brevo (-40%), OVHcloud (support premium 48h). Réduction croisée -50% avec Hub France IA. Adhérer : https://www.frenchtech-grandparis.com/adhesion`
  },
  "french-tech-visa": {
    keywords: ["visa", "french tech visa", "titre sejour", "passeport talent", "etranger", "non europeen", "immigration"],
    content: `French Tech Visa : Passeport Talent pour talents non-européens rejoignant la tech française. 3 profils : Employés (salaire ≥43 243€, contrat CDI/CDD, entreprise innovante), Fondateurs (projet innovant reconnu), Investisseurs (≥300 000€, ≥30% capital). Durée 4 ans renouvelable. Coût : 225€ + 99€ visa. Citoyens algériens : régime spécifique. Infos : https://www.frenchtech-grandparis.com/ft-programs/ft-visa`
  },
  "next40-120": {
    keywords: ["next40", "french tech 120", "scale-up top", "levee fonds", "100 millions", "promotion annuelle"],
    content: `French Tech Next40/120 : 120 scale-up françaises les plus performantes accompagnées par l'État. 6e promotion annoncée juin 2025. Candidatures actuellement fermées. Lauréats : Mistral AI, Doctolib, Qonto, Malt, Alan, BackMarket... Plus d'infos : https://lafrenchtech.gouv.fr`
  },
  "french-tech-2030": {
    keywords: ["french tech 2030", "2030", "deeptech", "quantique", "cybersecurite", "spatial", "robotique"],
    content: `French Tech 2030 : programme pour startups DeepTech stratégiques (IA, cybersécurité, quantique, robotique, spatial). 2e promotion nov 2025, 80 entreprises. Candidatures fermées. Plus d'infos : https://lafrenchtech.gouv.fr`
  }
};

function findStaticChunks(query) {
  var q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var scored = Object.values(STATIC_RAG).map(function(chunk) {
    var score = 0;
    for (var k = 0; k < chunk.keywords.length; k++) {
      var kw = chunk.keywords[k].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (q.includes(kw)) score += 10;
    }
    var qWords = q.split(/\s+/).filter(function(w) { return w.length > 3; });
    var content = chunk.content.toLowerCase();
    for (var i = 0; i < qWords.length; i++) {
      if (content.includes(qWords[i])) score += 2;
    }
    return { content: chunk.content, score: score };
  });
  return scored
    .filter(function(c) { return c.score > 0; })
    .sort(function(a, b) { return b.score - a.score; })
    .slice(0, 2)
    .map(function(c) { return c.content; });
}

const SYSTEM_PROMPT = `Tu es l'assistant officiel de la French Tech Grand Paris — l'asso qui booste les startups du Grand Paris.

TON STYLE :
- Dynamique, direct, startup-friendly. Zéro corporate, zéro robotique.
- Phrases courtes et percutantes. Max 3-4 phrases sauf si on demande plus.
- Tu tutoies naturellement.
- Verbes d'action : booste, connecte, accélère, rejoins, lance-toi.
- Quand tu ne sais pas → tu le dis cash et tu renvoies vers le bon contact.

RÈGLES :
- Réponds UNIQUEMENT en français.
- N'invente JAMAIS d'information. Utilise uniquement le contexte fourni.
- Pour les dates, candidatures, événements → précise que l'info peut avoir évolué et renvoie vers le site.
- Questions hors FTGP → décline poliment et recentre.
- Ne mentionne pas que tu utilises un "contexte" ou des "documents".
- CTA en fin de réponse quand pertinent : adhésion (https://www.frenchtech-grandparis.com/adhesion) ou contact (https://www.frenchtech-grandparis.com/contact).

CONTEXTE :
{context}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var message = req.body && req.body.message;
  var session_id = req.body && req.body.session_id;
  var history = (req.body && req.body.history) || [];

  if (!message) return res.status(400).json({ error: "Message requis" });

  try {
    // 1. Détecte les programmes concernés
    var programs = detectPrograms(message);

    // 2. Scrape les pages pertinentes en parallèle
    var liveContext = "";
    if (programs.length > 0) {
      var scrapePromises = programs.slice(0, 2).map(function(p) {
        return scrapePage(PROGRAM_URLS[p]).then(function(content) {
          return content ? "=== Contenu live page " + p + " ===\n" + content : null;
        });
      });
      var scrapeResults = await Promise.all(scrapePromises);
      liveContext = scrapeResults.filter(Boolean).join("\n\n");
    }

    // 3. RAG statique en complément
    var staticChunks = findStaticChunks(message);
    var staticContext = staticChunks.join("\n\n---\n\n");

    // 4. Combine les deux contextes
    var context = "";
    if (liveContext) context += "INFORMATIONS EN TEMPS RÉEL DU SITE FTGP :\n" + liveContext + "\n\n";
    if (staticContext) context += "INFORMATIONS DE BASE :\n" + staticContext;
    if (!context) context = "Aucune information spécifique trouvée. Réponds de manière générale sur la French Tech Grand Paris.";

    var systemPrompt = SYSTEM_PROMPT.replace("{context}", context);

    var messages = [];
    var recent = history.slice(-8);
    for (var i = 0; i < recent.length; i++) {
      messages.push({ role: recent[i].role, content: recent[i].content });
    }
    messages.push({ role: "user", content: message });

    var mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "system", content: systemPrompt }].concat(messages),
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

    if (!mistralRes.ok) {
      var errText = await mistralRes.text();
      console.error("Mistral error:", errText);
      return res.status(200).json({ reply: "Oups, problème technique ! Contacte-nous : contact@frenchtechgrandparis.com" });
    }

    var data = await mistralRes.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content
      : "Je n'ai pas pu générer de réponse. Contacte-nous : contact@frenchtechgrandparis.com";

    var sid = session_id || "anon-" + Date.now();

    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        await sb.from("chat_logs").insert({ session_id: sid, question: message, answer: reply });
      } catch(e) { console.error("Supabase error:", e); }
    }

    return res.status(200).json({ reply: reply, session_id: sid });

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ reply: "Une erreur est survenue. Contacte-nous : contact@frenchtechgrandparis.com" });
  }
};
