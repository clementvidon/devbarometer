export type RelevanceCalibrationCase = {
  itemRef: string;
  title: string;
  content: string;
  expectedCategory: 'emotional_insight' | 'factual_insight' | 'noise';
  expectedRelevant: boolean;
  why: string;
};

export const RELEVANCE_CALIBRATION_FIXTURES: RelevanceCalibrationCase[] = [
  {
    itemRef: 'https://reddit.com/comments/1mlcbdh',
    title:
      'Le développement Android est-il en train de mourir en île-de-France? Que devrais-je faire ?',
    content:
      'Je suis développeur Android confirmé... je postule tous les jours... très peu de retours...',
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Peur, tristesse et projection négative explicites sur la demande marché.',
  },
  {
    itemRef: 'https://reddit.com/comments/1nidftu',
    title: "Les ghosts jobs c'est devenu la norme ?",
    content:
      'Ça fait 5 mois que je cherche... les ghost jobs représentent au moins 50% des offres...',
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Colère et frustration explicites liées à la recherche d’emploi.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n7kytg',
    title: 'Ma boite ne recrute plus de juniors',
    content:
      "Pas de junior en tech, c'est notamment une demande des clients...",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Signal marché direct formulé sur un ton inquiet et tendu.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n5t57k',
    title: 'Product Owner freelance - Marché KO',
    content:
      "Je suis à mon compte... le marché est loin d'être au beau fixe...",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Tension marché explicite avec ressenti négatif clair.',
  },
  {
    itemRef: 'https://reddit.com/comments/1myac5s',
    title: 'Les influenceurs linkedin vendeur de formation',
    content: "c'est envoyé les gens au casse pipe... marché ultra bouché...",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Colère explicite reliée à la saturation du marché.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mzouwp',
    title:
      'Stack Overflow se penche sur les salaires des développeurs français',
    content: '',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Titre informatif neutre, sans charge émotionnelle exploitable.',
  },
  {
    itemRef: 'https://reddit.com/comments/1nog7d5',
    title:
      '«Recruter un junior relève de la philanthropie»: l’IA menace-t-elle le métier de développeur ?',
    content: '',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Headline informative sans texte utilisateur exprimant un ressenti.',
  },
  {
    itemRef: 'https://reddit.com/comments/1nthn8k',
    title:
      "Le cabinet de conseil Accenture se sépare de ses salariés dépassés par l'IA",
    content: '',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Information marché brute, pas d’émotion utilisateur propre.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mft6ot',
    title:
      'Trouver son premier taff en cybersecurité qu’avec des certifications',
    content: 'avec la certification compTIA et OSCP c’est suffisant ?',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question utilitaire neutre sur l’accès au marché.',
  },
  {
    itemRef: 'https://reddit.com/comments/1o2y61t',
    title: 'À quoi ressemble un entretien Angular pour un poste débutant ?',
    content:
      'petit doute... participé à un projet où il y avait de l’Angular...',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question de préparation, informative, peu émotionnelle.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mzlepr',
    title: "[MegaThread] Recherches/Offres d'emploi",
    content:
      "C'est en commentaire de ce post que vous pouvez écrire vos recherches...",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Conteneur communautaire, pas un insight.',
  },
  {
    itemRef: 'https://reddit.com/comments/1o1du0h',
    title: 'On review vos CVs dev en live, chaque semaine sur Discord',
    content: 'on lance une review de CVs en live...',
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Promo/service communautaire.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mjjz0r',
    title: 'Création du flair META',
    content: "j'ai donc créé ce flair...",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Post méta pur.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mky1pa',
    title: 'Construit un agent en moins de 300 lignes de code (Go)',
    content: 'Je partage cet article...',
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Partage technique, hors marché émotionnel.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mj2vuj',
    title:
      "J'ai viré un Freelance en moins de 3 jours parce qu'il comprenait rien",
    content:
      "Petit retour d'expérience... 600€/jour... et là, c'est le drame...",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Workplace drama fort, pas de généralisation marché suffisante.',
  },
];
