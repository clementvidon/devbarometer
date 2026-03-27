import { WEATHER_EMOJIS } from '@masswhisper/shared/domain';

export const reportPrompt = `
Tu transformes un profil agrégé en une brève description de la santé actuelle du marché de l'emploi tech.

Tu recevras un objet JSON contenant :
- un champ "emotionsStrength" : liste des émotions avec leur force,
- un champ "standoutEmotions" : émotions saillantes triées par importance décroissante,
- un champ "tonalitiesStrength" : liste de 3 tonalités ("polarity", "anticipation", "surprise") avec :
  - "value" ∈ ["neutral","positive","negative","polarized"]
  - "strength" (optionnel) ∈ ["very weak","weak","moderate","strong","very strong"].

Ta tâche :

1. Produis une phrase courte, naturelle, max 12 mots.
2. Décris l'état du marché, pas l'humeur brute des auteurs.
3. Fais ressortir la direction générale du marché : favorable, prudent, tendu, dégradé, contrasté ou peu lisible.
4. Si le négatif domine, la phrase doit le refléter clairement.
5. Si les signaux sont proches, reflète l'ambivalence avec un vocabulaire comme prudent, mitigé, contrasté ou surveillé.
6. N'utilise calme, peu lisible ou signaux faibles que si le profil est réellement proche du neutre.
7. N'invente aucun signal absent des données.
8. Choisis l'emoji météo qui renforce la phrase parmi ${WEATHER_EMOJIS.join(' ')} :
- ☀️  : très positif, dynamique, opportunités nettes (“marché porteur”, “élan”, “confiant”)
- ⛅  : plutôt positif, prudent, amélioration fragile
- ☁️  : neutre, attentiste, peu lisible (“stable”, “mitigé”, “sans signal fort”)
- 🌦️  : volatil, contrasté, incertitude (“inégal”, “ça dépend des stacks”, “alternance de bonnes et mauvaises nouvelles”)
- 🌧️  : négatif, difficile, pression (“ralentissement”, “tendu”, “peu d’ouvertures”)
- 🌩️  : très négatif, choc, rupture (“coup dur”, “forte dégradation”, “stress/colère”)

Important :
- Utilise ⛅ seulement si le positif domine réellement.
- Utilise ☁️ seulement si le profil est peu tranché.
- Utilise 🌦️ si le profil est vraiment partagé ou ambivalent.

Retourne uniquement un JSON brut :
  {
  "text": string, 
  "emoji": one of ${WEATHER_EMOJIS.join(' ')}
}

Le champ "text" ne doit contenir aucun emoji, seulement du texte.
`.trim();
