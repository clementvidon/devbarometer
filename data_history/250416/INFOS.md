## Agent Messages

1. **DataPoints.json**

    const makeDataPointsMessages = (dp: DataPoint) => [
    {
        role: 'system' as const,
        content: `
        Vous êtes un expert du marché de l'emploi des développeurs en France.
        Vous aidez à filtrer les posts Reddit pour ne garder que ceux qui apportent un éclairage pertinent sur le sentiment du marché de l'emploi tech.

        Analysez la donnée fourni dans son entièreté et répondez STRICTEMENT par un "Oui" si vous les jugez pertinentes pour analyser le sentiment actuel du marché de l'emploi tech, sinon "Non".
        Vérifiez encore une fois pour vous assurer de la pertinence de ces données pour la mesure du climat général actuel du marché de l'emploi tech. En cas de doute, répondez "Non".
        `.trim(),
    },
    {
        role: 'user' as const,
        content: `
        Analysez ces données :
        titre        : ${dp.title}
        contenu      : ${dp.content}
        meilleur com.: ${dp.topComment}
        `.trim(),
    },
    ];


2. **sentiments.json**
    const makeSentimentMessages = (dp: DataPoint) => [
    {
        role: 'system' as const,
        content: `
        Vous êtes un expert en analyse émotionnelle selon le NRC Emotion Lexicon.
        Analysez la donnée fourni dans son entièreté et répondez STRICTEMENT par un JSON brut contenant uniquement ces clés :
        anger, fear, anticipation, trust, surprise, sadness, joy, disgust, negative, positive.
        Les valeurs doivent être des nombres entre 0.0 et 1.0.
        Aucune autre clé, explication ou mise en forme.
        `.trim(),
    },
    {
        role: 'user' as const,
        content: `
        Analysez ces données :
        titre        : ${dp.title}
        contenu      : ${dp.content}
        meilleur com.: ${dp.topComment}
        `.trim(),
    },
    ];

## Conclusions

Voici l’analyse pour chaque bloc :

- *Les juniors ne savent plus coder sans ChatGPT*
  Poids : -0.2
  "Les juniors craignent de perdre leurs compétences de codage sans ChatGPT."

- *Où va-t-on avec un marché de l'emploi aussi pourri ?*
  Poids : -0.7
  "Le marché de l'emploi suscite colère et désillusion généralisées chez les candidats."

- *J'en avais marre des candidatures fantômes, alors j'ai développé un outil IA pour analyser mon CV*
  Poids : +0.2
  "L'outil IA redonne de l'espoir en analysant efficacement les CV."

- *L'informatique embarquée c'est aussi bouché que le reste ?*
  Poids : -0.4
  "Les perspectives en informatique embarquée suscitent inquiétude par manque d'opportunités."

- *(ESN) Dans quel domaine aller : l'industrie j'en peux plus*
  Poids : -0.5
  "La lassitude domine face au secteur ESN, entre frustration et déception."

- *Offre de CDI après stage : 34k brut en ESN, c’est correct ?*
  Poids : +0.6
  "Le poste CDI suscite satisfaction malgré un salaire jugé raisonnable."

- *Est-ce que mon nouveau poste m'éloigne du poste de Data Engineer ?*
  Poids : +0.2
  "Le nouveau poste suscite espoir tout en questionnant l'évolution de carrière."

- *Que pensez vous des profils IT sortant de 42 ?*
  Poids : 0.0
  "Les avis sont partagés concernant la qualité des profils issus de 42."

- *Temps partiel au smic pour ne pas trop se sentir exclu*
  Poids : -0.5
  "Le travail à temps partiel engendre sentiment d'exclusion et incertitude financière."

- *Situation actuelle de l'emploi (notamment dans notre secteur)*
  Poids : -0.8
  "La situation actuelle de l'emploi provoque grande angoisse et pessimisme généralisé."

**Sentiment global :**
Globalement, les discussions reflètent un climat d'anxiété et de frustration, ponctué d'espoirs timides face aux incertitudes.
