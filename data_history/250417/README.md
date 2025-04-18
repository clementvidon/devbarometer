## Agent Messages

1.  **DataPoints.json**

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
    content: `     Analysez ces données :
    titre        : ${dp.title}
    contenu      : ${dp.content}
    meilleur com.: ${dp.topComment}
    `.trim(),
    },
    ];

2.  **sentiments.json**
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
    titre : ${dp.title}
    contenu : ${dp.content}
    meilleur com.: ${dp.topComment}
    `.trim(),
    },
    ];

## Conclusions

1. **Les juniors ne savent plus coder sans ChatGPT. C’est grave ou normal ?**
   Poids : -0,2 – Les juniors dépendent trop de l'IA, générant inquiétude et frustration.

2. **Où va‑t‑on avec un marché de l'emploi aussi pourri ?**
   Poids : -0,7 – Le marché du travail suscite découragement et peur chez les professionnels.

3. **J'en avais marre des candidatures fantômes, alors j'ai développé un outil IA pour analyser mon CV**
   Poids : +0,2 – L'outil IA pour CV crée de l'espoir et soulagement chez le candidat.

4. **Pourquoi l’IT valorise-t-il si peu l’auto-formation, alors qu’elle en est le cœur même ?**
   Poids : -0,2 – Le sentiment d'injustice face au manque de reconnaissance persiste chez les autoformés.

5. **L'informatique embarquée c'est aussi bouché que le reste ?**
   Poids : -0,4 – L'embouteillage dans l'informatique embarquée engendre frustration et inquiétude croissantes.

6. **Temps partiel au smic pour ne pas trop se sentir exclu**
   Poids : -0,5 – Le temps partiel paye mal et nourrit solitude et sentiment d'exclusion.

7. **Que pensez vous des profils IT sortant de 42 ?**
   Poids : 0,0 – Les avis sont partagés mais teintés de curiosité et d'optimisme prudent.

8. **Est-ce que mon nouveau poste m'éloigne du poste de Data Engineer ?**
   Poids : +0,2 – Cette transition suscite espoir modéré et légère inquiétude quant au futur.

9. **Situation actuelle de l'emploi (notamment dans notre secteur)**
   Poids : -0,6 – La situation de l'emploi provoque profond découragement et sentiment d'urgence partagé.

Global : Une atmosphère globale de pessimisme et d'inquiétude prédomine face aux défis du marché et de l'IA.
