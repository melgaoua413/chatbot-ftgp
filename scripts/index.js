const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── TOUS TES RAGS ────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    title: "French Tech Grand Paris — Présentation générale",
    url: "https://www.frenchtech-grandparis.com",
    content: `French Tech Grand Paris est une association loi 1901 et une Communauté labellisée French Tech. Elle accompagne les startups et PME innovantes du territoire Grand Paris : Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, Essonne, Val-d'Oise, Seine-et-Marne, Yvelines. Contact : contact@frenchtechgrandparis.com. Adhésion : https://www.frenchtech-grandparis.com/adhesion`
  },
  {
    title: "Track IA — Programme IA French Tech Grand Paris",
    url: "https://www.frenchtech-grandparis.com/ft-programs/track-intelligence-artificielle",
    content: `Track IA est le programme d'accompagnement continu pour startups et scale-ups IA de la French Tech Grand Paris. Objectifs : accélérer les startups IA prometteuses, faciliter l'accès aux financements, créer des opportunités BizDev, structurer la montée en compétence. Formats : Ateliers thématiques, Masterclass IA, Feuillets IA, Soirées BizDev Find Your Prospect, Cartographie IA (visibilité auprès de +150 grands groupes, 50 ETI, +100 investisseurs), événements salons. Éligibilité : startups avec IA au cœur du produit, adhérentes FTGP. Pas besoin de clients, early stage accepté. Coût : inclus dans l'adhésion FTGP. Programme continu, pas de promotion annuelle. FTGP est ambassadrice du plan national Osez l'IA. Candidature : https://npammhndz0r.typeform.com/to/A1cmwNFi Contact éligibilité : melissa@frenchtech-grandparis.fr`
  },
  {
    title: "HIIT — Health Innovation Intensive Training",
    url: "https://www.frenchtech-grandparis.com/ft-programs/hiit",
    content: `HIIT (Health Innovation Intensive Training) est un programme intensif d'une semaine pour startups MedTech et HealthTech, sous Haut Patronage du Président de la République, dans le cadre de la stratégie Innovation Santé 2030. Public : startups en phase pré-clinique. Format : 1 semaine intensive obligatoire. Sélection : jury multidisciplinaire (cliniciens, investisseurs medtech, experts réglementaires, market access). Gratuit : 72 startups déjà accompagnées sans frais. Ce que ça apporte : clarification trajectoire réglementaire MDR marquage CE, rencontres soignants patients AP-HP HAS DGOS, compréhension attentes investisseurs, communauté alumni. HIIT n'est PAS un incubateur. Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "Gen50Tech — Programme inclusion générationnelle",
    url: "https://www.frenchtech-grandparis.com/ft-programs/gen50tech--frenchtech-grandparis",
    content: `Gen50Tech est un programme contre l'âgisme dans la tech porté par French Tech Grand Paris. La French Tech ne compte que 2,4% de salariés de plus de 55 ans. Gen50Tech agit pour changer ça. Programme structuré avec ateliers trimestriels, toolkit RH, assistant virtuel pour rendre les offres inclusives, job datings dédiés +50 ans. Signataires : 360Learning, Brevo, Doctolib, Malt, Swile, Ledger, Gojob, Pigment, Alma, Electra, Welcome to the Jungle. Engagements : lutter contre l'âgisme, ouvrir les recrutements, expérimenter sans quota imposé. Adapté à toutes tailles : startups scale-ups fonds grands groupes. Pour signer la charte : https://www.frenchtech-grandparis.com/adhesion`
  },
  {
    title: "French Tech Tremplin — Entrepreneuriat et diversité",
    url: "https://www.frenchtech-grandparis.com/ft-programs/french-tech-tremplin",
    content: `French Tech Tremplin est un programme d'égalité des chances pour entrepreneurs issus de milieux sous-représentés. Lancé en 2019. Prix européen de la Promotion de l'Esprit d'Entreprise. FTGP a accompagné plus de 250 startups en phase Prépa et plus de 170 en phase Incubation. Critères sociaux au moins 1 : bénéficiaire RSA AAH ASS, étudiant boursier échelon 5 à 7, pupille de l'État, résident QPV ou ZRR, statut réfugié OFPRA. Phase PRÉPA 2 mois : porteurs de projets innovants, résidents Île-de-France hors 78 et 91, disponibles 2 mois. Phase INCUBATION : entreprise créée depuis moins de 3 ans, projet innovant tech. Bourse jusqu'à 22900 euros BPIFrance, 1 an d'incubation gratuite, mentorat, plus de 250 alumni. Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "Ville de Demain — Smart City et collectivités",
    url: "https://www.frenchtech-grandparis.com/ft-programs/ville-de-demain",
    content: `Ville de Demain est un programme co-construit par la Métropole du Grand Paris et French Tech Grand Paris pour accélérer les collaborations entre startups et collectivités. 7 piliers : Mobilité, Logistique urbaine, Participation citoyenne, Énergie, Bâtiment et Aménagement, Gestion des risques et ressources, Économie Circulaire. Ambassadeurs : Eridanis, YOUrban, Altaroad, WISP Solutions, Wintics, Cleed.ai. Format : 4 soirées networking par an avec 50 participants. Annuaire smart city : visibilité auprès des 130 communes de la Métropole du Grand Paris. Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "Scale-Up Excellence — Nouveau programme FTGP",
    url: "https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence",
    content: `Scale-Up Excellence est le nouveau programme de la French Tech Grand Paris dédié aux scale-ups en forte croissance. Pour toutes les informations à jour sur ce programme : https://www.frenchtech-grandparis.com/ft-programs/scale-up-excellence Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "Je choisis la French Tech — Programme achats",
    url: "https://www.frenchtech-grandparis.com/ft-programs/je-choisis-la-french-tech",
    content: `Je choisis la French Tech est un programme pour doubler les achats publics et privés vers les startups d'ici 2027. 11 grands groupes engagés à consacrer 1 milliard d'euros aux startups French Tech 2024-2026 : ADP, AXA, BPCE, Capgemini, CMA CGM, EDF, FDJ, Orange, SNCF, Sopra Steria, BNP Paribas. Plus de 700 entreprises participantes, plus de 90 partenaires publics. Reverse Pitchs FTGP réservés aux membres adhérents : Partech, Kima Ventures, Carrefour, Caisse des Dépôts, AXA, EDF déjà réalisés. Pour participer aux reverse pitchs : adhésion obligatoire. Adhésion : https://www.frenchtech-grandparis.com/adhesion`
  },
  {
    title: "French Tech Central — Accès aux services publics",
    url: "https://www.frenchtech-grandparis.com/ft-programs/french-tech-central",
    content: `French Tech Central facilite l'accès des startups aux services publics. Lancé en 2017. Plus de 60 administrations partenaires, plus de 245 correspondants. Lieux totems Paris : Morning Bourse et Station F. Formats : office hours, workshops, masterclasses, RDV 1-to-1 de 30 minutes avec experts INPI URSSAF France Travail Bpifrance DGFiP Douanes CNRS DRIETTS. Thèmes : financement subventions CIR dettes, protection innovations, juridique fiscal, recrutement, propriété intellectuelle. Chiffres 2023 : 245 interlocuteurs publics, 125 masterclasses, 2419 RDV startups. Éligible : toutes startups sans critère de taille secteur ou stade. Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "French Tech Visa — Titre de séjour pour talents étrangers",
    url: "https://www.frenchtech-grandparis.com/ft-programs/ft-visa",
    content: `French Tech Visa est un titre de séjour simplifié Passeport Talent pour talents non-européens rejoignant la tech française. 3 profils : Employés salaire supérieur à 43243 euros brut par an contrat CDI ou CDD entreprise innovante, Fondateurs projet innovant reconnu ressources supérieures au SMIC 21621 euros, Investisseurs plus de 300000 euros investissement direct plus de 30 pour cent du capital. Durée jusqu'à 4 ans renouvelable. Famille incluse conjoint peut travailler. Coût total 225 euros plus 99 euros visa. Citoyens algériens régime spécifique. Demande : https://france-visas.gouv.fr Contact : https://www.frenchtech-grandparis.com/contact`
  },
  {
    title: "Adhésion French Tech Grand Paris",
    url: "https://www.frenchtech-grandparis.com/adhesion",
    content: `L'adhésion à French Tech Grand Paris est annuelle. Elle donne accès à tous les programmes Track IA HIIT Gen50Tech Tremplin Ville de Demain, les événements exclusifs, le réseau de startups membres, la visibilité dans l'écosystème. Perks adhérents : Optivalue.ai 3 mois offerts Team 3000 euros, BPI France 30 minutes chargé affaires innovation, Pennylane 2 mois offerts, Brevo moins 40 pour cent, OVHcloud support premium 48h. Réduction croisée moins 50 pour cent avec Hub France IA. Adhérer : https://www.frenchtech-grandparis.com/adhesion`
  },
  {
    title: "French Tech Next40/120 — Scale-ups les plus performantes",
    url: "https://lafrenchtech.gouv.fr",
    content: `French Tech Next40/120 est un programme annuel de l'État accompagnant les 120 scale-up françaises les plus performantes. Lancé en 2019. Next40 : 40 startups les plus performantes avec CA supérieur à 100 millions d'euros et croissance de 15 pour cent sur 3 ans, ou levées cumulées supérieures à 100 millions d'euros. French Tech 120 : 80 startups à fort potentiel. 6e promotion 2025 annoncée le 5 juin 2025. Candidatures actuellement fermées. Lauréats Next40 : Mistral AI, Doctolib, BlaBlaCar, Qonto, Malt, Alan, BackMarket, Ledger, PayFit, Contentsquare, Exotec. Plus d'infos : https://lafrenchtech.gouv.fr`
  },
  {
    title: "French Tech 2030 — Startups DeepTech stratégiques",
    url: "https://lafrenchtech.gouv.fr",
    content: `French Tech 2030 est un programme pour startups DeepTech stratégiques dans les domaines IA cybersécurité quantique robotique spatial électronique infrastructures cloud. 2e promotion novembre 2025, 80 entreprises sélectionnées. Marraine : Christel Heydemann DG Orange. Éligibilité : créée depuis janvier 2012, siège en France, plus de 3 millions d'euros levés ou générés depuis janvier 2023, non cotée, TRL supérieur ou égal à 6. Accompagnement 1 an avec start-up manager dédié. Candidatures fermées. Plus d'infos : https://lafrenchtech.gouv.fr`
  }
];

// ─── DÉCOUPAGE EN CHUNKS ──────────────────────────────────────────────────
function chunkText(text, maxChars) {
  maxChars = maxChars || 800;
  var sentences = text.split(/(?<=[.!?])\s+/);
  var chunks = [];
  var current = "";
  for (var i = 0; i < sentences.length; i++) {
    if ((current + " " + sentences[i]).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentences[i];
    } else {
      current = current ? current + " " + sentences[i] : sentences[i];
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── EMBEDDING VIA MISTRAL ────────────────────────────────────────────────
async function getEmbedding(text) {
  var res = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + MISTRAL_API_KEY
    },
    body: JSON.stringify({
      model: "mistral-embed",
      inputs: [text]
    })
  });
  if (!res.ok) {
    var err = await res.text();
    throw new Error("Mistral embedding error: " + err);
  }
  var data = await res.json();
  return data.data[0].embedding;
}

// ─── INDEXATION PRINCIPALE ────────────────────────────────────────────────
async function indexAll() {
  console.log("Démarrage de l'indexation...");
  console.log("Suppression des anciens documents...");
  await sb.from("documents").delete().neq("id", 0);
  console.log("Table vidée.");

  var totalChunks = 0;

  for (var i = 0; i < DOCUMENTS.length; i++) {
    var doc = DOCUMENTS[i];
    console.log("\nTraitement : " + doc.title);
    var chunks = chunkText(doc.content);
    console.log("  → " + chunks.length + " chunk(s)");

    for (var j = 0; j < chunks.length; j++) {
      var chunk = chunks[j];
      try {
        // Attente courte pour éviter rate limit Mistral
        await new Promise(function(r) { setTimeout(r, 200); });
        var embedding = await getEmbedding(chunk);
        var insertRes = await sb.from("documents").insert({
          content: chunk,
          embedding: embedding,
          metadata: {
            title: doc.title,
            url: doc.url,
            chunk_index: j,
            total_chunks: chunks.length
          }
        });
        if (insertRes.error) {
          console.error("  ✗ Erreur insert chunk " + j + ":", insertRes.error.message);
        } else {
          console.log("  ✓ Chunk " + (j + 1) + "/" + chunks.length + " indexé");
          totalChunks++;
        }
      } catch(e) {
        console.error("  ✗ Erreur chunk " + j + ":", e.message);
      }
    }
  }

  console.log("\n✅ Indexation terminée ! " + totalChunks + " chunks indexés dans Supabase.");
}

indexAll().catch(function(e) {
  console.error("Erreur fatale:", e);
  process.exit(1);
});
