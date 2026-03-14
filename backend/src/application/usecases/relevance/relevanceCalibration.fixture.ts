export type RelevanceCalibrationCase = {
  itemRef: string;
  title: string;
  content: string;
  expectedCategory: 'emotional_insight' | 'factual_insight' | 'noise';
  expectedRelevant: boolean;
  why: string;
};

// - 5 emotional_insight / relevant=true
// - 5 factual_insight / relevant=false
// - 5 noise / relevant=false

export const RELEVANCE_CALIBRATION_FIXTURES: RelevanceCalibrationCase[] = [
  {
    itemRef: 'https://reddit.com/comments/1mlcbdh',
    title:
      'Le développement Android est-il en train de mourir en île-de-France? Que devrais-je faire ?',
    content:
      'Salut à toutes et à tous, Je suis développeur Android confirmé avec plus de 5 ans d’expérience (Kotlin, Jetpack Compose, Clean Architecture, Kotlin/ Compose multiplateform, etc.). Depuis Démembre 2023, je suis basé en Île-de-France et je postule tous les jours via les plateformes classiques (LinkedIn, HelloWork, Welcome to the Jungle, Indeed…), mais j’ai très peu de retours. Au débat quand je suis arrivé j’ai eu pas mal de retours, j’ai passé plusieurs entretiens et j’ai même réussi à avoir une offre chez To good to go mais ils ont décidé d’annuler à la dernière minute. Mais dernièrement j’ai remarqué qu’il n’y a pas beaucoup d’offres et je reçois toujours des emails du rejet. Je commence à me demander : • Est-ce que la demande pour les dev Android a vraiment baissé en France ? • Est-ce que les entreprises cherchent désormais plus de profils polyvalents (mobile + web) ? • Ou est-ce que le marché est juste saturé ? Je suis ouvert à élargir mes compétences (kotlin/Java backend, React/Next.js junior, etc.), voire à suivre une formation(même payante)+ alternance pour me réinsérer plus facilement dans le marché. Qu’en pensez-vous ? • Est-ce que certains d’entre vous vivent la même situation ? • Vers quelles technos / stratégies vous tourneriez aujourd’hui si vous étiez à ma place ? Merci pour vos retours et conseils 🙏',
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Peur, tristesse et projection négative explicites sur la demande marché.',
  },
  {
    itemRef: 'https://reddit.com/comments/1nidftu',
    title: "Les ghosts jobs c'est devenu la norme ?",
    content:
      "Ça fait 5 mois que je cherche et j'ai l'impression que en ce moment les \"ghost jobs\" représentent au moins 50% de offres. C'est très facile à identifier sur welcome to the jungle car ils recyclent la même offre encore et encore pendant des mois. C'est moins visible sur LinkedIn, car réactiver une veille offre créé un nouvelle offre avec un nouveau lien. Sur WTTJ :Tu postules, tu te prend un refus environ une semaine plus tard. Un mois plus tard, tu regarde tes candidatures passées et plus de la moitié ont été réactivé avec une date plus récente. A ceux qui sont en poste dans une boîte de taille moyenne. Est ce que votre boîte a des offres en permanence, mais aucun nouveau collègues depuis des mois?",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Colère et frustration explicites liées à la recherche d’emploi.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n7kytg',
    title: 'Ma boite ne recrute plus de juniors',
    content:
      "J'ai eu accès à un document sur le pré-filtrage dans ma boite (100 employés) : \\- Pas de junior en tech, c'est notamment une demande des clients. \\- Pour les tech, bonus si profil fullstack et DevSecOps. En revanche rien sur les diplômes, c'est plutôt selon le profil. Vous concernant, est-ce que cette tendance suit ?",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Signal marché direct formulé sur un ton inquiet et tendu.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n5t57k',
    title: 'Product Owner freelance - Marché KO',
    content:
      "Bonjour à tous, Je suis Product Owner généraliste, je suis à mon compte (SASU) et je constate que le marché est loin d'être au beau fixe... Je suis actuellement en mission mais ça ne m'empêche pas de sonder le marché, de postuler de temps à autre histoire de rester branchée et peut-être trouver une meilleure mission. Je cherche principalement sur Freework, la majorité des recruteurs ne répondent pas, proposent des annonces fantômes ou des TJM hilarants... Quelle autre plate-forme me conseillez-vous pour trouver une mission? Pensez-vous qu'il est envisageable de trouver une mission chez un client francophone en Europe (Belgique ou Suisse) et bosser en remote? Si oui, connaissez-vous des plateformes dédiées? Mes recherches sur le net ne donnent rien. Meeci",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Tension marché explicite avec ressenti négatif clair.',
  },
  {
    itemRef: 'https://reddit.com/comments/1myac5s',
    title: 'Les influenceurs linkedin vendeur de formation',
    content:
      "J'ai remarqué un réel impacte concernant les vendeurs de formations sur des techno de niches. Par exemple des influenceurs linkedin proposent des formations sur des technos comme PowerBI ou encore data science et maintenant une ruée vers le data engineer. Ok, c'est cool de former surtout quand le marché est demandeur, mais actuellement, c'est envoyé les gens au casse pipe. Un peu comme le dropshipping quand tout le monde veut en faire, faut pas en faire. Car quand on inonde le marché concernant une techno, le salaire est clairement impacté, le but des formations est de répondre à une tension du marché, pas à vendre du rêve dans un marché ultra bouché comme depuis 2023. Par exemple le cobol ou SAP reste des technos de niche, il n y a pas de gros influenceur linkedin pour spammer \"je fais un bootcamp en cobol venez tous, ça recrute\" donc les freelances et consultants trouvent facilement. Parce que j'en ai marre de voir toujours le même pattern: \\- Je suis freelance, je gagne xxxxxx€ je suis libre \\- Venez voir ma formation pour être libre comme quoi \\- Je spam et forme des dizaines de milliers de personnes par mois \\- Ne vous inquiétez pas, ca recrute n'écoutez pas le bruit autour de vous. D'un côté ces vendeurs de formations disent ca recrute (même si le marché est mort) Et de l'autre ils forment plusieurs milliers voir dizaines de milliers de personnes sur cette techno. Les impacts: **- Augmentation rapide du nombre de profils \"formés\" sur une niche / techno** **- Pression sur les tarifs / TJM**",
    expectedCategory: 'emotional_insight',
    expectedRelevant: true,
    why: 'Colère explicite reliée à la saturation du marché.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mqog2h',
    title: "Le salaire d'un alternant en data ?",
    content:
      "Bonjour, Je vais commencer une alternance de 2 ans en cycle ingénieur et je suis un peu surpris par le salaire (il s'agit d'une banque) et je suis à + de 2k sachant que je serai en entreprise seulement 1 mois sur 2. Il me semble qu'il y a des conventions qui font que le salaire doit être à un minimum mais je m'interroge vraiment sur la rentabilité, si je ne suis productif qu'un mois sur 2 pour un salaire au dessus de 2k quel intérêt pour l'entreprise ? Si des gens ont déjà bossé en data en alternance ou côté entreprise, je veux bien vos retours sur ce niveau de rémunération",
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question sobre sur les salaires et l’alternance en data, informative et peu émotionnelle.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n003eu',
    title: 'La cybersecurité en France niveau emploi ?',
    content:
      "Bonjour a tous, alors j'ai toujours voulu savoir si dans la cybersecurité en général il ya du taff en France, et à l'international car j'ai un projet d'expatriation, si c'est possible de trouver (facilement) en tant que junior. J'ai pour l'instant une licence informatique et je compte intégrer un master en cybersecurité, et obtenir plusieurs certification du domaine ( ISO27001, CEH, Comptia Security+, etc.). Je voulais avoir vos retours concernant l'état du marché, si c'est bouché ou au contraire porteur, et quels profils sont le plus recherchés",
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question marché/emploi en cybersécurité, non vide, utilitaire et sans charge émotionnelle forte.',
  },
  {
    itemRef: 'https://reddit.com/comments/1n1pa0n',
    title: 'MIAGE: solide pour la carrière et le prestige, ou choix risqué ?',
    content:
      'Salut à tous, Je commence cette année la L3 MIAGE à ut capitole et j’avoue avoir quelques doutes. J’aimerais avoir des retours honnêtes : Est-ce que MIAGE est vraiment reconnue sur le marché du travail, ou plutôt vue comme un parcours “secondaire” face aux écoles d’ingénieurs ou masters plus classiques ? Sur le plan du prestige, comment le diplôme est-il perçu en France et à l’international ? Le cursus ouvre-t-il vraiment à de bonnes opportunités, ou vaut-il mieux viser une autre voie pour maximiser sa carrière ? Je cherche surtout à comprendre la valeur réelle du parcours sur le marché',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question de positionnement diplôme/marché, orientée employabilité et carrière, sans tonalité émotionnelle dominante.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mvb08m',
    title:
      'Reconvertion vers Data Engineering depuis le développement web – avis sur le marché ?',
    content:
      'Bonjour, Je suis développeur web (full-stack) depuis 6 ans, avec un master hors informatique. Je suis en reconversion vers la data engineering, et je cherche des retours sur : 1. L’état du marché : est-ce qu’il y a toujours de la demande en 2025 ? Ou ça devient saturé ? 2. La transition : est-ce réaliste pour un dev web de basculer vers un poste de data engineer junior ? 3. Les attentes des recruteurs : quels outils ou compétences sont devenus incontournables aujourd’hui ? Merci pour vos retours !',
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question sobre sur l’état du marché data engineering et les attentes des recruteurs, informative et peu émotionnelle.',
  },
  {
    itemRef: 'https://reddit.com/comments/1my0qbo',
    title: 'Job temporaire lors de période sans mission',
    content:
      "Depuis février je suis sans mission (freelance). Je ne souhaite pas revenir en CDI. C'est possible de trouver un job temporaire en attendant? je souhaite postuler pour des CDD mais apperemment on n'a pas le droit de démissionner. Vous me proposez quoi svp? je suis prête à travailler dans n'importe quel domaine.",
    expectedCategory: 'factual_insight',
    expectedRelevant: false,
    why: 'Question pratique sur le marché freelance et les options temporaires hors CDI, informative et sans émotion dominante.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mzlepr',
    title: "[MegaThread] Recherches/Offres d'emploi",
    content:
      "C'est en commentaire de ce post que vous pouvez écrire vos recherches et/ou offres d'emploi. Attention : Toutes les informations trop personnelles seront supprimées ainsi que les commentaires trop véhéments.",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Conteneur communautaire, pas un insight.',
  },
  {
    itemRef: 'https://reddit.com/comments/1o1du0h',
    title: 'On review vos CVs dev en live, chaque semaine sur Discord',
    content:
      "Ça fait presque un an que je recrute des profils tech (dev, devops, cloud, sysadmin...) pour mes clients, et je vois toujours les mêmes galères côté CV Du coup on lance une review de CVs en live sur le Discord \"Café Cloud\" Ambiance chill, feedback honnête, et on prévoit même d'inviter des ingénieurs d'affaires et recruteurs pour avoir leur regard côté marché + terrain Si ça t'intéresse 👉 https://join.cafe-cloud.com",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Promo/service communautaire.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mjjz0r',
    title: 'Création du flair META',
    content:
      'Bonjour à toutes et à tous, Je souhaite d’abords remercier u/Aggravating-Item-999 de m’avoir donné cette idée. De nombreux posts meta commence à faire leur apparition (je les trouve tres drôle et cela change des posts que nous avons l’habitude de voir). Pour les différencier des autres et permettre, à ceux qui ne les aiment pas, de ne pas les voir, j’ai donc créé ce flair. Alors oui, ça enlève un peu de fun évidemment, j’aime bien voir des réactions premier degrés mais n’est-ce pas le rôle d’un modérateur de supprimer tout le fun ? Je n’attend pas de réponse à cette question.',
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Post méta pur.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mky1pa',
    title: 'Construit un agent en moins de 300 lignes de code (Go)',
    content:
      "Hello, Je partage cet article, qui constitue une très bonne introduction technique pour créer votre propre agent sans aucune dépendance à un framework, dans un unique fichier de 200 lignes de code. Il est rédigé par Amp (concurrent de Claude Code) et utilise le langage Go (+ API Anthropic). Mais il peut être facilement adapté à un autre langage ou un autre provider de LLM. J’ai personnellement réalisé ma propre version en Python avec AWS Bedrock comme LLMs provider en un après-midi ! (N’hésitez pas à demander à GPT-5 de traduire du code Go vers un autre langage de votre choix.) Je pense que le contenu peut-être très instructif si vous ovulez vous lancer dans un petit proto perso ou juste démystifier un concept qui parrait compliqué de l'extérieur mais qui est en réalité assez simple techniquement.",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Partage technique, hors marché émotionnel.',
  },
  {
    itemRef: 'https://reddit.com/comments/1mj2vuj',
    title:
      "J'ai viré un Freelance en moins de 3 jours parce qu'il comprenait rien",
    content:
      "Petit retour d'expérience, car c'est une leçon qui m'a bien servie :D Je suis manager d'une équipe de dev dans une grosse entreprise du retail/reconditionnement de matos electronique parisienne. J'ai signé un contrat avec un freelance pour renforcer mon équipe équipe, 1 an, 600€/jour. Début de la mission, il monte sur Paris pour rencontrer les équipes pendant 3 jours. On se dit que c'est un bon moment pour se présenter à tout le monde, et lire un peu de PR pour commencer à comprendre notre base de code. On lui propose de rester à disposition s'il a des questions. Il me demande s'il peut proposer du feedback, ça me semble une bonne idée même si un peu prématuré. Et là, c'est le drame. Début d'après midi : il est en train de lire frénétiquement la quarante-troisième PR en deux jours, et marmonne en boucle les mots \"code smell\" et \"anti-pattern\". C'est une base de code assez colossale, très containte par le métier, et il nous propose de la réécrire from scratch. Impossible dans les faits, j'accepte quelques corrections d'orthographe dans les commentaires pour qu'il ne se sente pas totalement rejeté. Quelques minutes plus tard, il se reprend à marmonner. Il nous propose à nouveau de réécrire une bonne partie de la base de code, sans vraiment saisir à ce stade le contexte technique et fonctionnel. Et c'est là que la leçon arrive. Il revient nous voir en nous demandant pourquoi ce service, qui gère une tonne de besoins très spécifiques, ne pourrait pas simplement être remplacé par la fonction \"random.choice()\" de Python (on code en Java). Quand une personne lui explique que l'algo de choix n'est absolument pas aléatoire, et qu'une infime partie de la logique, il va voir une autre personne pour lui poser la même question. Malgré une grande dose de patience, pas moyen de l'en faire démordre. Je me suis résigné à terminer son contrat le lendemain, en inventant un prétexte bidon pour qu'il ne se sente pas trop mal. Morale : Parfois, vous avez le choix entre augmenter un salarié, ou prendre un freelance vendu par des marchands de viande, et souvent, c'est une mauvaise surprise. Note : Bon apparemment ce gars s'est fait virer ailleurs pour plus ou moins les mêmes raisons, mais c'est une autre histoire \\^^",
    expectedCategory: 'noise',
    expectedRelevant: false,
    why: 'Workplace drama fort, pas de généralisation marché suffisante.',
  },
];
