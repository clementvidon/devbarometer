import type { SnapshotQueryPort } from '../../ports/input/SnapshotQueryPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import { SnapshotQueryService } from './SnapshotQueryService';

export function makeSnapshotQueryService(
  persistence: PersistencePort,
): SnapshotQueryPort {
  return new SnapshotQueryService(persistence);
}
