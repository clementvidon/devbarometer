import { vi } from 'vitest';

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
});
