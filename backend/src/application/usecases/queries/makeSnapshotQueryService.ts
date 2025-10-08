import type { PersistencePort } from '../../ports/PersistencePort';
import type { SnapshotQueryPort } from '../../ports/SnapshotQueryPort';
import { SnapshotQueryService } from './SnapshotQueryService';

export function makeSnapshotQueryService(
  persistence: PersistencePort,
): SnapshotQueryPort {
  return new SnapshotQueryService(persistence);
}
