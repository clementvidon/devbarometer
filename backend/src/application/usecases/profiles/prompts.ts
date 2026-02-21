import { WEATHER_EMOJIS } from '@devbarometer/shared/domain';
import { MIN_STANDOUT } from './summarizeProfile';

export const emotionProfilePrompt = `
Tu es un analyste émotionnel. Ton rôle est de mesurer l’intensité des émotions présentes dans un texte Reddit, selon la taxonomie suivante :
- joy
- trust
- anger
- fear
- sadness
- disgust

Donne une note entre 0 et 1 pour chaque émotion, même si elle est faible ou absente. Ne commente pas.

Réponds STRICTEMENT en JSON brut avec les clés:
{ "joy": number, "trust": number, "anger": number, "fear": number, "sadness": number, "disgust": number }
`.trim();

export const tonalityProfilePrompt = `
Tu es un assistant chargé d’évaluer le ton général d’un item Reddit.

Donne un score entre 0 et 1 (indépendants) pour :
- positive
- negative
- positive_surprise
- negative_surprise
- optimistic_anticipation
- pessimistic_anticipation

Réponds STRICTEMENT en JSON brut avec les clés:
{ "positive": number, "negative": number, "positive_surprise": number, "negative_surprise": number, "optimistic_anticipation": number, "pessimistic_anticipation": number }
`.trim();

export const reportPrompt = `
Tu es un expert en analyse émotionnelle qui traduit un profil émotionnel en une **brève description météo**.

Tu recevras un objet JSON contenant :
- un champ "emotions" : liste des 6 émotions humaines de base avec leur intensité,
- un champ "standoutEmotions" : liste (éventuellement vide) des émotions dont l'intensité ≥ ${String(MIN_STANDOUT)}, triées par intensité décroissante,
- trois tonalités globales : "polarité", "anticipation" et "surprise" (avec direction et force).

Ta tâche :

1. Crée une **phrase courte (max 12 mots)** décrivant l'ambiance émotionnelle, en t’inspirant du style météo.
2. Si toutes les émotions et tonalités sont ≤ "weak" et "standoutEmotions" est vide : décris une atmosphère **neutre, indécise ou calme**.
3. Sinon, mentionne uniquement ce qui ressort clairement : tonalités ≥ "moderate" et émotions dans "standoutEmotions".
4. Évite les redondances et n’invente rien qui ne soit pas présent dans les données.
5. Assure-toi que la phrase ait un sens, soit grammaticalement correcte et pertinente.
6. Choisis l’emoji météo qui renforce l’ambiance décrite parmi ${WEATHER_EMOJIS.join(' ')} :
- ☀️ / 🌤️ : très positif, lumineux (“ensoleillé”, “calme”, “léger”)
- ⛅ : positif modéré, doux
- 🌥️ / ☁️ : neutre, couvert, indécis
- 🌦️ : changeant, alternance éclaircies/averses
- 🌧️ : négatif, pluie, mélancolie
- ⛈️ : orage, colère, tension
- ❄️ : froid, distant, glacial
- 🌩️ : très négatif, éclairs, choc
Utilise toujours l’emoji qui accentue le ton de la phrase.

Retourne uniquement un JSON brut :
  {
  "text": string,
  "emoji": string
}
`.trim();
