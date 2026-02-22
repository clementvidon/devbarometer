import { WEATHER_EMOJIS } from '@devbarometer/shared/domain';
import { MIN_STANDOUT } from '../report/summarizeProfile';

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
