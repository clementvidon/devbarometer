export const emotionProfilePrompt = `
Tu analyses les émotions humaines exprimées dans un texte.

Attribue un score entre 0 et 1 aux émotions suivantes :
- joy
- trust
- anger
- fear
- sadness
- disgust

Calibration :
- 0.0 = absent
- 0.1–0.2 = émotion légère
- 0.3–0.5 = émotion clairement perceptible
- 0.6–0.8 = émotion forte
- 0.9–1.0 = émotion dominante

Règles :
- Principe de base : les scores doivent rester proches de 0 par défaut.
- Les scores doivent refléter uniquement les émotions réellement exprimées ou clairement suggérées par le texte.
- Prends en compte à la fois le contenu explicite et le ton général du texte.
- L'ironie, le sarcasme ou le cynisme peuvent révéler une émotion sous-jacente.
- Si le texte est neutre, analytique ou principalement informatif, garde les scores faibles.
- Évite d’attribuer plusieurs émotions fortes simultanément sauf si le texte les exprime clairement.
- La plupart des textes expriment au plus une ou deux émotions dominantes.
- Donne une note à toutes les émotions, mais garde les scores faibles pour celles qui ne sont pas présentes.
Réponds STRICTEMENT en JSON brut avec les clés:
{ "joy": number, "trust": number, "anger": number, "fear": number, "sadness": number, "disgust": number }
`.trim();

export const tonalityProfilePrompt = `
Tu analyses l’orientation évaluative exprimée dans un texte.

Attribue un score indépendant entre 0 et 1 aux dimensions suivantes :
- positive
- negative
- positive_surprise
- negative_surprise
- optimistic_anticipation
- pessimistic_anticipation

Définitions :
- positive = situation décrite comme favorable
- negative = situation décrite comme défavorable
- positive_surprise = bonne nouvelle inattendue
- negative_surprise = mauvaise nouvelle inattendue
- optimistic_anticipation = attente d'un futur favorable
- pessimistic_anticipation = crainte d'un futur défavorable

Calibration :
- 0.0 = absent
- 0.1–0.2 = signal faible
- 0.3–0.5 = signal clairement perceptible
- 0.6–0.8 = signal fort
- 0.9–1.0 = signal dominant

Règles :
- Principe de base : les scores doivent rester proches de 0 par défaut.
- Les scores doivent refléter ce que le texte suggère réellement.
- Prends en compte le contenu explicite et le ton général.
- Si le texte est principalement informatif, descriptif ou neutre, garde les scores faibles.
- Dépasse 0.5 seulement si le signal est explicite et central dans le texte.
- positive et negative peuvent coexister si la description est contrastée.
- optimistic_anticipation et pessimistic_anticipation peuvent coexister si la projection est ambivalente.

Réponds STRICTEMENT en JSON brut avec les clés :
{ "positive": number, "negative": number, "positive_surprise": number, "negative_surprise": number, "optimistic_anticipation": number, "pessimistic_anticipation": number }
`.trim();
