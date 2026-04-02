import { Sub, Tag } from "./tracker-types";

// Helper to create features without apostrophes
function f(id: number, label: string, opts?: { macro?: string; micro?: string; note?: string }): any {
  return {
    id, gid: 0, // gid assigned later
    macro: opts?.macro || "none",
    micro: opts?.micro || "none",
    label, note: opts?.note || "", tags: []
  };
}

function grp(id: string, name: string, features: any[]): any {
  return { id, name, features };
}

function sub(id: string, name: string, groups: any[]): Sub {
  return { id, name, groups } as Sub;
}

export const TAB_NAMES = [
  "Structuration du cadre de vie",
  "Suivi de progression",
  "Bulle de deconnection",
  "Affordance core gameplay"
];

export const TAB_AXES = [0, 0, 1, 1]; // 0=epanouissement, 1=relaxation
export const AXE_LABELS = ["Epanouissement", "Relaxation"];

export function getInitialTags(): Tag[] {
  return [
    { id: "t1", label: "Tuile", color: "#00c48c" },
    { id: "t2", label: "Rituel", color: "#8b7ff5" },
    { id: "t3", label: "Echo question", color: "#00bcd4" },
    { id: "t4", label: "Observatoire", color: "#9c27b0" },
    { id: "t5", label: "Carnet", color: "#795548" },
    { id: "t6", label: "Deck de solution", color: "#8b7ff5" },
    { id: "t7", label: "Visua biolumi", color: "#e91e8c" },
    { id: "t8", label: "Cabinet de secours", color: "#e24b4a" },
    { id: "t9", label: "Arbre anima", color: "#8bc34a" },
    { id: "t10", label: "Serre Botanique", color: "#f5a623" }
  ];
}

export function getInitialData(): Sub[][] {
  const tab1: Sub[] = [
    sub("s1-1", "Auto regulation legere", [
      grp("g1-1-1", "general", [
        f(1, "Creation d un monde <b>safeplace identitaire</b>"),
        f(2, "Agencer son quotidien par des <b>petites actions repetees</b>"),
        f(3, "<b>Gamification equilibre</b> pour rester affordant"),
        f(4, "Rituel d action de <b>relaxation</b> (placebo)", { note: "Rituels visuellement incarnes - effet placebo" }),
        f(5, "Creer des moment rituels diegetiques par de la <b>narration visuel legere</b>", { note: "Narratif visuel leger et phenomenologique" }),
        f(6, "<b>Rituels structurants</b> avec evolution progressif", { macro: "outdated" }),
        f(7, "Deblocage aise de ces <b>actions rituels</b>"),
        f(8, "Ordre de deblocage <b>guide/intuitif</b>"),
        f(9, "Acces rapide a ces <b>rituels</b> une fois deverrouille"),
        f(10, "Thematique comprehensible aborde par ces <b>rituels</b>"),
        f(11, "Mise en <b>introspection</b> pour acceder a une zone de troubles"),
        f(12, "Mise en <b>session</b> adapte sur des cycles predefinis", { note: "Ouverture depuis plus de 4h entre 4h et 1h" }),
        f(13, "Mise en rituel de l <b>ouverture/cloture</b> d un cycle journee"),
        f(14, "Recap/synthese de cette <b>fin de journee</b> (biofeedback possible)")
      ])
    ]),
    sub("s1-2", "Identification d une vulnerabilite", [
      grp("g1-2-1", "general", [
        f(1, "<b>Pedagogie</b> des troubles etudiables", { note: "Presentation impact sur le quotidien" }),
        f(2, "Auto comprehension de l etat actuel par le <b>phenotypage</b>"),
        f(3, "<b>Agentivite</b> sur le rythme de pheno"),
        f(4, "Outils d evaluations <b>MAPI</b> en acces direct"),
        f(5, "Acquisition de la <b>confiance utilisateur</b> par une tutorisation explicite"),
        f(6, "Pour les utilisateurs hermetiques proposer un <b>parcours plus progressif</b>", { macro: "horsmvp" }),
        f(7, "Suivi de la progression du <b>phenotypage initial</b> (qualitatif)"),
        f(8, "Suivi de la progression du <b>phenotypage approfondi</b> (quantitatif)"),
        f(9, "<b>Visualisation graphique</b> et interpretation des resultats", { note: "Informatif validable mise en confiance" }),
        f(10, "Suivi temporel de ces <b>donnees</b>"),
        f(11, "Presenter et guider sur les <b>moyens d actions externes</b>"),
        f(12, "Systeme de <b>suivi des solutions externes</b>")
      ])
    ]),
    sub("s1-3", "Accompagnement et experience intro", [
      grp("g1-3-1", "general", [
        f(1, "<b>Agentivite</b> dans l elaboration d une routine"),
        f(2, "Outils et Rituels d <b>expressivite emotionnel</b>"),
        f(3, "Outils introspectif de <b>comprehension de soi</b>"),
        f(4, "Point d environnement qui reagit a l <b>etat emotionnel</b> du user"),
        f(5, "Experience de <b>soutien emotionnel</b>", { note: "Bienveillance proximite soutien moral" }),
        f(6, "Outil personnel de suivi type <b>journal</b> pour se confier", { macro: "horsmvp" }),
        f(7, "<b>Rituels meditatifs</b> / rassurant", { macro: "outdated" }),
        f(8, "Options de <b>personnalisation</b> d experience"),
        f(9, "Accompagnement semi-automatise <b>suggestions intelligentes</b>", { macro: "horsmvp" }),
        f(10, "Mise en place de <b>rappel d action</b> personnalise", { macro: "horsmvp" }),
        f(11, "Notification d <b>action disponible</b>"),
        f(12, "<b>Recompense</b> a la hauteur des efforts fournis"),
        f(13, "Systeme de notification diegetique - <b>boite aux lettres</b>")
      ])
    ]),
    sub("s1-4", "Gain de confiance", [
      grp("g1-4-1", "general", [
        f(1, "Tutorisation avenante ET fonctionnel sur les <b>benefices</b>"),
        f(2, "<b>Reassurance</b> sur le phenotypage", { note: "Presentation des intentions et benefices" }),
        f(3, "<b>Transparence</b> sur le pheno", { note: "Le pourquoi le comment pas de tracking deguise" }),
        f(4, "<b>Phenotypage progressif</b>", { note: "Montee de precision et confiance" }),
        f(5, "Interface <b>rassurante structuree</b> et accessible"),
        f(6, "Documentation accessible sur le <b>process de pheno</b>", { macro: "horsmvp" })
      ])
    ])
  ];

  const tab2: Sub[] = [
    sub("s2-1", "Mesure progression tuile", [
      grp("g2-1-1", "general", [
        f(1, "Systeme d <b>exploration systemique</b>", { micro: "doing", note: "Lisibilite de l ensemble la mecanique" }),
        f(2, "<b>Arbre de fusion</b> simple", { micro: "done", note: "Relier en vue de au moins deux niveaux" }),
        f(3, "Rythme de <b>progression exponentiel</b>"),
        f(4, "Lisibilite de l ensemble la <b>mecanique</b>"),
        f(5, "<b>Combinaison croisee</b> intuitive"),
        f(6, "Arbre de fusion en apparence simple mais <b>riche en profondeur</b>"),
        f(7, "<b>Nommage</b> des tuiles - comprehension du sujet")
      ]),
      grp("g2-1-2", "lors des fusions", [
        f(1, "Surcoute UX informative lors de la <b>decouverte notable</b> de recette", { note: "Lors de la tuile chaine du noeud de complexite" }),
        f(2, "<b>Gratification</b> par feedback lors de palier atteint"),
        f(3, "Lors du menu contextuel : <b>Preview</b> de la tuile resultante"),
        f(4, "Lors du menu contextuel : <b>Preview tuile generique</b> unknown"),
        f(5, "Lors du maintien : <b>Feedback visuel</b> si fusion possible"),
        f(6, "Lors du maintien : <b>Preview</b> de la tuile resultante"),
        f(7, "Lors du maintien : <b>Preview generique</b> si recette inconnue")
      ]),
      grp("g2-1-3", "codex macro", [
        f(1, "Centralisation de la progression dans un <b>codex</b>", { macro: "horsmvp" }),
        f(2, "Instance diegetique <b>botanique</b> pour regrouper la progression", { macro: "horsmvp" }),
        f(3, "Codex accessible via <b>acces diegetique</b>", { macro: "horsmvp" }),
        f(4, "Collection des <b>tuiles decouverte</b>", { note: "Trier par ID Nom Visuel" }),
        f(5, "La collection est <b>filtrable</b> par biome ou ALL"),
        f(6, "Indicateur de <b>progression</b> par biome"),
        f(7, "La collection est chapitree par <b>tier de complexite</b>"),
        f(8, "La collection est <b>triable</b>"),
        f(9, "Par option possibilite d afficher la <b>silhouette</b> des tuiles inconnues")
      ]),
      grp("g2-1-4", "codex micro", [
        f(1, "Par tuile une icone indique les <b>recettes liees</b>"),
        f(2, "Chaque tuile est selectionnable donnant acces a de <b>nouvelle option</b>"),
        f(3, "<b>Focus view</b>"),
        f(4, "Liste des <b>recettes communes</b> pour l avenir"),
        f(5, "Liste des <b>recettes connues</b> associees a cette tuile"),
        f(6, "Indication quantitative de la progression du <b>nb de recette</b> liee")
      ])
    ]),
    sub("s2-2", "Mesure progression psyche", [
      grp("g2-2-1", "general", [
        f(1, "<b>Visualisation Qualitative</b> de l Indice de confiance", { micro: "doing" }),
        f(2, "Les points d acces sont toujours facilement <b>discernables</b>"),
        f(3, "Affichage du <b>nom de l instance</b> lors de l ouverture"),
        f(4, "<b>Helper UX</b> - mise en marge des points d acces"),
        f(5, "Visualisation diegetique de l <b>implication</b> dans les questionnaires"),
        f(6, "Visualisation du nombre de <b>solution active</b>")
      ]),
      grp("g2-2-2", "questionnaire standardise", [
        f(1, "Acces diegetique - <b>questionnaire standardise</b>", { note: "CTA lorsque l etat semble trouble" }),
        f(2, "Suggestion de <b>thematiques</b> lors de vos CTA"),
        f(3, "Visualisation qualitative de l <b>etat de l utilisateur</b>")
      ]),
      grp("g2-2-3", "resultat de pheno", [
        f(1, "<b>Carnet de resultat</b> du phenotypage"),
        f(2, "Visualisation qualitative de la premiere <b>materialisation pheno</b>"),
        f(3, "CTA vers le carnet a la fin du <b>pheno qualitatif</b>"),
        f(4, "<b>Suivi de reponse</b> - suivi interne des donnees")
      ]),
      grp("g2-2-4", "solution externe", [
        f(1, "Acces diegetique - <b>Suivi de solution externe</b>"),
        f(2, "CTA vers les <b>solutions externes</b> a la fin d un questio")
      ]),
      grp("g2-2-5", "pharmacie", [
        f(1, "Acces diegetique - <b>Numero pro</b>")
      ])
    ]),
    sub("s2-3", "Mesure progression enviro", [
      grp("g2-3-1", "general", [
        f(1, "<b>Serre botanique</b>"),
        f(2, "<b>Espace creatif</b> avec tuile"),
        f(3, "Acces <b>codex</b>"),
        f(4, "<b>Note commune</b> entre les tuiles (animals)"),
        f(5, "Visualisation diegetique en phase de controle - <b>tuile macro</b>"),
        f(6, "Visualisation diegetique en phase de controle - <b>tuile micro</b>"),
        f(7, "Fatigue - <b>graciete / personnalite / thyme</b>")
      ])
    ])
  ];

  const tab3: Sub[] = [
    sub("s3-1", "Espace refuge immersif", [
      grp("g3-1-1", "general", [
        f(1, "Atmosphere <b>chaleureuse et cozy</b>", { micro: "done" }),
        f(2, "Espace de jeu <b>amenageable</b> par l utilisateur", { note: "Espace d expressivite et pseudo identitaire" }),
        f(3, "Espace de jeu <b>affordant</b>"),
        f(4, "<b>Pro-activite</b> dans l amenagement du monde"),
        f(5, "Amenagement <b>bac a sable</b> base sur des tuiles decoratives"),
        f(6, "Possibilite de detente par des <b>auto-objectifs</b>"),
        f(7, "Personnalisation <b>color ou rotation</b> des plans de jeu", { macro: "horsmvp" }),
        f(8, "Gratification du travail d amenagement par des <b>recompenses diegetiques</b>"),
        f(9, "<b>Design narratif</b> systemique leger"),
        f(10, "Exploration combinatoire des tuiles par leur <b>decouverte</b>"),
        f(11, "Exploration combinatoire des tuiles par leur <b>amenagement</b>"),
        f(12, "Etre temoin d <b>evenement diegetique</b>"),
        f(13, "Notification d elements scripte + <b>cinematique</b>", { macro: "outdated" }),
        f(14, "Resultat <b>repercussion des rituels</b> sur le monde"),
        f(15, "Resultat repercussion de la <b>sante joueur</b> sur le monde"),
        f(16, "Resultat repercussion de l <b>investissement du joueur</b>", { note: "Support emotionnel biofeedback" })
      ])
    ]),
    sub("s3-2", "Satisfaction dopaminergique et sensoriel", [
      grp("g3-2-1", "general", [
        f(1, "<b>Immersion sensoriel</b> par l audio le visuel et les materiaux", { note: "Puissant vecteur de satisfaction immediate" }),
        f(2, "<b>Feedback fort</b> par des reponses diegetiques", { note: "Feedback sono visuels animations ambiance matiere" }),
        f(3, "Le monde est <b>interactable diegetiquement</b> (Hearthstone style)"),
        f(4, "Chaine d <b>interaction diegetique</b> - setup et payoff", { micro: "doing" }),
        f(5, "Rituels avec des <b>interactions symbolique</b> et satisfaisante"),
        f(6, "Rituels avec des <b>feedback d action</b> gratifiant"),
        f(7, "Appreciation de l evolution <b>temporel</b> d element d interet"),
        f(8, "Appreciation de l evolution <b>visuel</b> de l espace de jeu"),
        f(9, "Appreciation de l evolution de <b>completion d etape majeur</b>", { macro: "horsmvp", note: "Puissant vecteur de satisfaction" })
      ])
    ])
  ];

  const tab4: Sub[] = [
    sub("s4-1", "Phenotypage et gain de tuile", [
      grp("g4-1-1", "general", [
        f(1, "Apparition de l UI de <b>phenotypage</b> lors de l activation d un rituel", { micro: "doing" }),
        f(2, "Repondre aux questions permet de faire apparaitre des <b>slots de recompense</b>"),
        f(3, "Repondre a plusieurs questions fait apparaitre un <b>slot bonus</b>"),
        f(4, "Par action du minijeu des <b>tuiles recompenses</b> apparaissent"),
        f(5, "Feedback de <b>tuile gagnee</b>"),
        f(6, "Confirmation d action lorsque l utilisateur <b>quitte l instance</b>", { note: "reset ce rituel reset ce minijeu desactivation" }),
        f(7, "Confirmation d action lors de l ouverture si des <b>tuiles sont deja presentes</b>"),
        f(8, "CTA de <b>recolte des tuiles</b>")
      ])
    ]),
    sub("s4-2", "Interaction entre tuiles", [
      grp("g4-2-1", "general", [
        f(1, "Les tuiles sont <b>interactables</b> entre elles par superposition"),
        f(2, "Ouverture d un <b>menu contextuel</b> d action lors de la superposition"),
        f(3, "Si possible : <b>Fusion</b> des tuiles superposees"),
        f(4, "<b>Interchanger</b> la position des tuiles superposees"),
        f(5, "<b>Annulation</b> de la mise en action"),
        f(6, "Menu contextuel d action <b>desactivable</b> par option utilisateur"),
        f(7, "Activation d une <b>aide a la decouverte</b> dans les options"),
        f(8, "Mise en exergue des tuiles <b>fusionnables</b> lors de la selection"),
        f(9, "Rituels diegetique par <b>entretiens</b> de la tuile via une autre"),
        f(10, "<b>Fusion graphique</b> entre tuiles similaire a la pose")
      ]),
      grp("g4-2-2", "lors du menu contextuel", [
        f(1, "<b>Preview</b> de la tuile resultante si recette connue"),
        f(2, "<b>Preview tuile generique</b> unknown si recette inconnue"),
        f(3, "<b>Verrouillage</b> du bouton de fusion si aucun resultat possible")
      ]),
      grp("g4-2-3", "lors du maintien d une tuile sur une autre", [
        f(1, "<b>Feedback visuel</b> leger si fusion possible"),
        f(2, "<b>Preview</b> de la tuile resultante si recette connue"),
        f(3, "<b>Preview tuile generique</b> si recette inconnue", { note: "Sans passer en menu contextuel" })
      ]),
      grp("g4-2-4", "outdated", [
        f(1, "<b>Feedback visuel</b> sur la nature de la fusion", { macro: "outdated", note: "fusion standard contrevisuelle extinction" }),
        f(2, "Notification d elements <b>scriptes</b> resultant d une fusion", { macro: "outdated" })
      ])
    ]),
    sub("s4-3", "Organisation des tuiles", [
      grp("g4-3-1", "general", [
        f(1, "<b>Tiroir</b> zone de depot stockage diegetique", { macro: "horsmvp", note: "Gestion du board sans avoir des tuiles personnelles" }),
        f(2, "Acces rapide a la <b>fonctionnalite</b>"),
        f(3, "Manipulable par un simple <b>drag and drop</b>"),
        f(4, "Organisation a la <b>guise du joueur</b>"),
        f(5, "Pas de <b>limitation de quantite</b>"),
        f(6, "<b>Destruction</b> d une tuile pour l eliminer du plateau")
      ])
    ]),
    sub("s4-4", "Deplacement des tuiles", [
      grp("g4-4-1", "general", [
        f(1, "Tuile <b>interactable</b> pour les interactions approfondies"),
        f(2, "Mise en phase <b>deplagable</b> de la tuile", { note: "Multi drag et drop" }),
        f(3, "Feedback UI indicatif du <b>timing de selection</b>"),
        f(4, "La selection de tuile ne doit pas etre <b>conflictuelle</b> avec le deplacement camera"),
        f(5, "Selection <b>multiple</b> possible", { macro: "horsmvp" }),
        f(6, "Feedback visuel si la tuile est <b>finale</b> (recettage)"),
        f(7, "Feedback visuel d une tuile en etat <b>deplagable</b>"),
        f(8, "Tuile en <b>deplacement</b> (en mouvement)"),
        f(9, "Feedback de la tuile en <b>deplacement</b>"),
        f(10, "Previsualisation UI du <b>placement</b> de la tuile si pose"),
        f(11, "Repere de zone des <b>cases possibles</b> (faded grid)", { macro: "outdated" }),
        f(12, "Feedback de <b>deplacement impossible</b>")
      ])
    ]),
    sub("s4-5", "Controle de la camera", [
      grp("g4-5-1", "general", [
        f(1, "Mode <b>Camera de gestion</b>"),
        f(2, "<b>Deplacement</b> de la camera par un drag"),
        f(3, "<b>Zoom in / zoom out</b> par un pinch"),
        f(4, "<b>Reset du zoom</b> camera par une action ou un bouton"),
        f(5, "Mode <b>Camera immersive</b>", { macro: "kill" }),
        f(6, "<b>Rotation</b> de la camera", { macro: "kill" }),
        f(7, "<b>Reset de la rotation</b> camera", { macro: "kill" })
      ])
    ])
  ];

  // Assign GIDs
  let gidCounter = 1;
  const allTabs = [tab1, tab2, tab3, tab4];
  for (const tab of allTabs) {
    for (const s of tab) {
      for (const g of s.groups) {
        for (const feat of g.features) {
          feat.gid = gidCounter++;
        }
      }
    }
  }

  return allTabs;
}
