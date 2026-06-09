import { vi } from "vitest";

interface MockQueryResult {
  data: unknown;
  error: null | { message: string; code: string };
  count?: number;
}

interface MockChain {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

function createChain(defaultResult: MockQueryResult): MockChain {
  const chain: MockChain = {} as MockChain;
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "in",
    "order", "limit", "range",
  ];

  for (const method of methods) {
    (chain as unknown as Record<string, unknown>)[method] = vi.fn(() => chain);
  }

  chain.single = vi.fn(() => Promise.resolve(defaultResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(defaultResult));
  chain.then = vi.fn((resolve: (v: MockQueryResult) => void) => {
    resolve(defaultResult);
    return chain;
  });

  return chain;
}

export function createMockSupabaseClient() {
  const defaultResult: MockQueryResult = { data: null, error: null };
  const chain = createChain(defaultResult);
  const mockFrom = vi.fn(() => chain);

  return {
    from: mockFrom,
    chain,
    setResult(result: Partial<MockQueryResult>) {
      const merged = { ...defaultResult, ...result };
      chain.single.mockResolvedValue(merged);
      chain.maybeSingle.mockResolvedValue(merged);
      chain.then.mockImplementation((resolve: (v: MockQueryResult) => void) => {
        resolve(merged);
        return chain;
      });
    },
  };
}

export function configureFromMock(
  mockFrom: ReturnType<typeof vi.fn>,
  tableResults: Record<string, { data?: unknown; error?: { message: string; code: string } | null }>
) {
  mockFrom.mockImplementation((table: string) => {
    const result = tableResults[table] ?? { data: null, error: null };
    const chain = createChain({ data: result.data ?? null, error: result.error ?? null });
    return chain;
  });
}
