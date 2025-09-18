import { PromptRelevanceFilterAdapter } from '../../adapter/driven/relevance/PromptRelevanceFilterAdapter.ts';
import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import { AgentService } from './AgentService.ts';

const relevanceFilterPrompt = `
Vous êtes un expert du marché de l'emploi des développeurs en France.
Vous aidez à filtrer des données de Reddit pour ne garder que celles qui apportent un éclairage pertinent sur le sentiment du marché de l'emploi tech.

Analysez cette donnée dans son entièreté et répondez STRICTEMENT en JSON brut au format : { "relevant": true } ou { "relevant": false }, aucune autre clé, texte, ou explication.
{ "relevant": true } si vous la jugez pertinente pour analyser le climat actuel du marché de l'emploi tech. Sinon, répondez { "relevant": false }.
Vérifiez encore une fois pour vous assurer de la pertinence de ces données pour la mesure du climat général actuel du marché de l'emploi tech. En cas de doute, répondez { "relevant": false }.
`;

export function makeCoreAgentService(
  itemsProvider: ItemsProviderPort,
  llm: LlmPort,
  persistence: PersistencePort,
): AgentService {
  const relevanceFilter = new PromptRelevanceFilterAdapter(
    llm,
    relevanceFilterPrompt,
  );
  return new AgentService(itemsProvider, llm, persistence, relevanceFilter);
}
