const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOCUMENTS = [
  {
    title: "French Tech Grand Paris — Présentation générale",
    url: "https://www.frenchtech-grandparis.com",
    content: "French Tech Grand Paris est une association loi 1901 et une Communauté labellisée French Tech. Elle accompagne les startups et PME innovantes du territoire Grand Paris : Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, Essonne, Val-d'Oise, Seine-et-Marne, Yvelines. Contact : contact@frenchtechgrandparis.com. Adhésion : https://www.frenchtech-grandparis.com/adhesion"
  },
  {
    title: "Track IA — Programme IA French Tech Grand Paris",
    url: "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
    content: "Track IA est le programme d'accompagnement continu pour startups et scale-ups IA de la French Tech Grand Paris. Formats : Ateliers thématiques, Masterclass IA, Feuillets IA, Soirées BizDev Find Your Prospect, Cartographie IA avec visibilité auprès de plus de 150 grands groupes. Éligibilité : startups avec IA au coeur du produit, adhérentes FTGP. Coût : inclus dans l'adhésion FTGP. Programme continu, pas de promotion annuelle. Candidature : https://npammhndz0r.typeform.com/to/A1cmwNFi Contact éligibilité : melissa@frenchtech-grandparis.fr"
  },
  {
    title: "HIIT — Health Innovation Intensive Training",
    url: "https://www.frenchtech-grandparis.com/ft-programs/hiit",
    content: "HIIT Health Innovation Intensive Training est un programme intensif d'une semaine pour startups MedTech et HealthTech, sous Haut Patronage du Président de la République. Public : startups en phase pré-clinique. Format : 1 semaine intensive obligatoire. Gratuit : 72 startups déjà accompagnées sans frais. HIIT n'est PAS un incubateur, pas d'hébergement ni de suivi continu. Contact : https://www.frenchtech-grandparis.com/contact"
  },
  {
    title: "Gen50Tech — Programme inclusion générationnelle",
    url: "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
    content: "Gen50Tech est un programme contre l'âgisme dans la tech porté par French Tech Grand Paris. La French Tech ne compte que 2,4 pourcent de salariés de plus de 55 ans. Programme structuré avec ateliers trimestriels, toolkit RH, job datings dédiés plus de 50 ans. Signataires : 360Learning, Brevo, Doctolib, Malt, Swile, Ledger. Pour signer la charte : https://www.frenchtech-grandparis.com/adhesion"
  },
  {
    title: "French Tech Tremplin — Entrepreneuriat et diversité",
    url: "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
    content: "French Tech Tremplin est un programme d'égalité des chances pour entrepreneurs issus de milieux sous-représentés. Lancé en 2019. Critères sociaux : bénéficiaire RSA AAH ASS, étudiant boursier échelon 5 à 7, résident QPV ou ZRR, statut réfugié OFPRA. Phase PRÉPA 2 mois : porteurs de projets innovants résidents Île-de-France. Phase INCUBATION : bourse jusqu'à 22900 euros BPIFrance, 1 an d'incubation gratuite. Contact : https://www.frenchtech-grandparis.com/contact"
  },
  {
    title: "Ville de Demain — Smart City et collectivités",
    url: "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
    content: "Ville de Demain est un programme co-construit par la Métropole du Grand Paris et French Tech Grand Paris. 7 piliers : Mobilité, Logistique urbaine, Participation citoyenne, Énergie, Bâtiment et Aménagement, Gestion des risques, Économie Circulaire. Format : 4 soirées networking par an avec 50 participants. Annuaire smart city : visibilité auprès des 130 communes de la Métropole. Contact : https://www.frenchtech-grandparis.com/contact"
  },
  {
    title: "Scale-Up Excellence — Nouveau programme FTGP",
    url: "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
    content: "Scale-Up Excellence est le nouveau programme de la French Tech Grand Paris dédié aux scale-ups en forte croissance. Pour toutes les informations à jour : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence Contact : https://www.frenchtech-grandparis.com/contact"
  },
  {
    title: "Je choisis la French Tech — Programme achats",
    url: "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
    content: "Je choisis la French Tech est un programme pour doubler les achats publics et privés vers les startups d'ici 2027. 11 grands groupes engagés : ADP, AXA, BPCE, Capgemini, CMA CGM, EDF, FDJ, Orange, SNCF, Sopra Steria, BNP Paribas. Reverse Pitchs réservés aux membres adhérents FTGP. Adhésion : https://www.frenchtech-grandparis.com/adhesion"
  },
  {
    title: "French Tech Central — Accès aux services publics",
    url: "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
    content: "French Tech Central facilite l'accès des startups aux services publics depuis 2017. Plus de 60 administrations partenaires. RDV 1-to-1 de 30 minutes avec experts INPI URSSAF Bpifrance DGFiP. Chiffres 2023 : 125 masterclasses, 2419 RDV startups. Éligible : toutes startups. Contact : https://www.frenchtech-grandparis.com/contact"
  },
  {
    title: "French Tech Visa — Titre de séjour pour talents étrangers",
    url: "https://www.frenchtech-grandparis.com/ft-programs/ft-visa",
    content: "French Tech Visa est un titre de séjour Passeport Talent pour talents non-européens. 3 profils : Employés salaire supérieur à 43243 euros, Fondateurs projet innovant reconnu, Investisseurs plus de 300000 euros. Durée jusqu'à 4 ans renouvelable. Famille incluse. Coût 225 euros plus 99 euros visa. Citoyens algériens régime spécifique. Demande : https://france-visas.gouv.fr"
  },
  {
    title: "Adhésion French Tech Grand Paris",
    url: "https://www.frenchtech-grandparis.com/adhesion",
    content: "L'adhésion à French Tech Grand Paris est annuelle. Accès à tous les programmes Track IA HIIT Gen50Tech Tremplin Ville de Demain, événements exclusifs, réseau membres. Perks : Optivalue.ai 3 mois offerts, BPI France 30 minutes expert, Pennylane 2 mois offerts, Brevo moins 40 pourcent, OVHcloud support premium. Réduction croisée moins 50 pourcent avec Hub France IA. Adhérer : https://www.frenchtech-grandparis.com/adhesion"
  },
  {
    title: "French Tech Next40/120",
    url: "https://lafrenchtech.gouv.fr",
    content: "French Tech Next40/120 accompagne les 120 scale-up françaises les plus performantes. Next40 : CA supérieur à 100 millions d'euros ou levées supérieures à 100 millions d'euros. 6e promotion annoncée juin 2025. Candidatures actuellement fermées. Lauréats : Mistral AI, Doctolib, BlaBlaCar, Qonto, Malt, Alan, BackMarket. Plus d'infos : https://lafrenchtech.gouv.fr"
  },
  {
    title: "French Tech 2030 — Startups DeepTech",
    url: "https://lafrenchtech.gouv.fr",
    content: "French Tech 2030 est un programme pour startups DeepTech dans les domaines IA cybersécurité quantique robotique spatial. 2e promotion novembre 2025, 80 entreprises. Éligibilité : créée depuis janvier 2012, siège en France, plus de 3 millions d'euros levés, TRL supérieur ou égal à 6. Candidatures fermées. Plus d'infos : https://lafrenchtech.gouv.fr"
  }
];

function chunkText(text, maxChars) {
  maxChars = maxChars || 600;
  var sentences = text.split(". ");
  var chunks = [];
  var current = "";
  for (var i = 0; i < sentences.length; i++) {
    var candidate = current ? current + ". " + sentences[i] : sentences[i];
    if (candidate.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentences[i];
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function getEmbedding(text) {
  var res = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + HF_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text })
    }
  );
  if (!res.ok) {
    var err = await res.text();
    throw new Error("HF embedding error: " + err);
  }
  var data = await res.json();
  if (Array.isArray(data[0])) {
    var dim = data[0].length;
    var avg = new Array(dim).fill(0);
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < dim; j++) {
        avg[j] += data[i][j] / data.length;
      }
    }
    return avg;
  }
  return data;
}

async function indexAll() {
  console.log("Démarrage indexation...");
  await sb.from("documents").delete().neq("id", 0);
  console.log("Table vidée.");
  var total = 0;
  for (var i = 0; i < DOCUMENTS.length; i++) {
    var doc = DOCUMENTS[i];
    console.log("\nTraitement : " + doc.title);
    var chunks = chunkText(doc.content);
    console.log("  -> " + chunks.length + " chunk(s)");
    for (var j = 0; j < chunks.length; j++) {
      try {
        await new Promise(function(r) { setTimeout(r, 500); });
        var embedding = await getEmbedding(chunks[j]);
        var r = await sb.from("documents").insert({
          content: chunks[j],
          embedding: embedding,
          metadata: { title: doc.title, url: doc.url, chunk_index: j }
        });
        if (r.error) {
          console.error("  X Erreur insert:", r.error.message);
        } else {
          console.log("  OK Chunk " + (j+1) + "/" + chunks.length + " indexé");
          total++;
        }
      } catch(e) {
        console.error("  X Erreur:", e.message);
      }
    }
  }
  console.log("\nTerminé ! " + total + " chunks indexés dans Supabase.");
}

indexAll().catch(function(e) {
  console.error("Erreur fatale:", e);
  process.exit(1);
});
