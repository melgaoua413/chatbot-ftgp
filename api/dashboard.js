const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    var sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Total conversations
    var total = await sb.from("chat_logs").select("*", { count: "exact", head: true });

    // Conversations des 7 derniers jours
    var since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    var week = await sb.from("chat_logs").select("*", { count: "exact", head: true }).gte("created_at", since);

    // Top 20 questions
    var questions = await sb.from("chat_logs").select("question, created_at").order("created_at", { ascending: false }).limit(200);

    // Conversations par jour (7 derniers jours)
    var byDay = await sb.from("chat_logs").select("created_at").gte("created_at", since).order("created_at", { ascending: true });

    var dayCount = {};
    if (byDay.data) {
      byDay.data.forEach(function(r) {
        var day = r.created_at.split("T")[0];
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
    }

    // Mots-clés les plus fréquents dans les questions
    var keywords = {};
    var stopwords = ["le","la","les","de","du","des","un","une","est","que","qui","quoi","comment","je","tu","il","nous","vous","ils","et","ou","mais","donc","car","pas","plus","très","bien","aussi","pour","avec","dans","sur","par","au","aux","en","a","y","se","si","ne","ce","mon","ton","son","ma","ta","sa","mes","tes","ses","notre","votre","leur","leurs","cest","je","vous","nous"];
    if (questions.data) {
      questions.data.forEach(function(r) {
        if (!r.question) return;
        r.question.toLowerCase().split(/\s+/).forEach(function(w) {
          w = w.replace(/[^a-zàâäéèêëîïôùûüç]/g, "");
          if (w.length > 3 && !stopwords.includes(w)) {
            keywords[w] = (keywords[w] || 0) + 1;
          }
        });
      });
    }
    var topKeywords = Object.entries(keywords).sort(function(a,b){ return b[1]-a[1]; }).slice(0,15);

    // Dernières conversations
    var recent = await sb.from("chat_logs").select("question, answer, created_at").order("created_at", { ascending: false }).limit(10);

    return res.status(200).json({
      total: total.count || 0,
      week: week.count || 0,
      byDay: dayCount,
      topKeywords: topKeywords,
      recent: recent.data || []
    });

  } catch(err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
