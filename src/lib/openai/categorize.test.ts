import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ OPENAI_API_KEY: "test-key" }),
}));

// Mock the OpenAI module
const mockCreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: function OpenAIMock() {
      return {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      };
    },
  };
});

vi.mock("./prompts", () => ({
  buildExpensePrompt: vi.fn(() => "categorize this expense"),
}));

describe("categorizeExpense", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns defaultResult when API call fails", async () => {
    mockCreate.mockRejectedValue(new Error("API timeout"));

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("clamps invalid category to 'other'", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "invalid_category",
              confidence: "high",
              cfr_citation: "§200.453",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result.category).toBe("other");
    expect(result.confidence).toBe("high");
  });

  it("clamps invalid confidence to 'low'", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "supplies",
              confidence: "very_high",
              cfr_citation: "§200.453",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result.category).toBe("supplies");
    expect(result.confidence).toBe("low");
  });

  it("returns defaultResult when content is null", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("returns defaultResult when content is malformed JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "not valid json {{{",
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("returns valid response as-is for known category/confidence/citation", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "travel",
              confidence: "high",
              cfr_citation: "§200.474",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Delta Airlines",
      description: "Conference travel",
      amount: 850,
    });

    expect(result.category).toBe("travel");
    expect(result.confidence).toBe("high");
    expect(result.cfr_citation).toBe("§200.474");
  });

  it("accepts all 9 valid SF-424A categories without clamping", async () => {
    const validCategories = [
      "personnel", "fringe_benefits", "travel", "equipment", "supplies",
      "contractual", "construction", "other", "indirect_charges",
    ];

    const { categorizeExpense } = await import("./categorize");

    for (const cat of validCategories) {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: cat,
                confidence: "medium",
                cfr_citation: "§200.420",
              }),
            },
          },
        ],
      });

      const result = await categorizeExpense("system prompt", {
        vendor: "Test",
        description: "Test",
        amount: 100,
      });

      expect(result.category).toBe(cat);
    }
  });

  it("returns default citation when cfr_citation is a non-string value", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "supplies",
              confidence: "medium",
              cfr_citation: 200453,
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result.category).toBe("supplies");
    expect(result.confidence).toBe("medium");
    expect(result.cfr_citation).toBe("§200.420");
  });

  it("returns default when choices array is empty", async () => {
    mockCreate.mockResolvedValue({ choices: [] });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("returns default when content is empty string", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    // Empty string → JSON.parse throws → caught → default
    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it('clamps reserved "total" category to "other"', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "total",
              confidence: "high",
              cfr_citation: "§200.420",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result.category).toBe("other");
  });

  it("handles missing category field in parsed JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ confidence: "high", cfr_citation: "§200.453" }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result.category).toBe("other");
    expect(result.confidence).toBe("high");
  });

  it("handles missing confidence field in parsed JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ category: "travel", cfr_citation: "§200.474" }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result.category).toBe("travel");
    expect(result.confidence).toBe("low");
  });

  it("handles null category in parsed JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ category: null, confidence: "medium", cfr_citation: "§200.420" }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result.category).toBe("other");
  });

  it("preserves valid CFR citation strings", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ category: "travel", confidence: "high", cfr_citation: "§200.474" }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Delta",
      description: "Flight",
      amount: 850,
    });

    expect(result.cfr_citation).toBe("§200.474");
  });

  it("handles empty description without error", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "other",
              confidence: "low",
              cfr_citation: "§200.420",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Unknown",
      description: "",
      amount: 50,
    });

    expect(result.category).toBe("other");
    expect(result.confidence).toBe("low");
  });

  it("handles very long description (5000+ chars) without crash", async () => {
    const longDescription = "A".repeat(5500);

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "supplies",
              confidence: "medium",
              cfr_citation: "§200.453",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: longDescription,
      amount: 150,
    });

    expect(result.category).toBe("supplies");
  });

  it("handles special characters (Unicode, HTML tags, SQL injection) without crash", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "other",
              confidence: "medium",
              cfr_citation: "§200.420",
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Café München <script>alert('xss')</script>",
      description: "Robert'); DROP TABLE expenses;--",
      amount: 100,
    });

    expect(result.category).toBe("other");
  });

  it("returns defaultResult on OpenAI rate limit (429)", async () => {
    const rateLimitError = new Error("Rate limit exceeded");
    (rateLimitError as Error & { status: number }).status = 429;
    mockCreate.mockRejectedValue(rateLimitError);

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("returns defaultResult on OpenAI timeout", async () => {
    mockCreate.mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("returns defaultResult when non-Error value is thrown (string)", async () => {
    mockCreate.mockRejectedValue("unexpected string error");

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Staples",
      description: "Office supplies",
      amount: 150,
    });

    expect(result).toEqual({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });
  });

  it("ignores extra fields in API response JSON", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: "travel",
              confidence: "high",
              cfr_citation: "§200.474",
              reasoning: "This is a travel expense for conference attendance",
              extra_field: 42,
            }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Delta",
      description: "Conference flight",
      amount: 850,
    });

    expect(result.category).toBe("travel");
    expect(result.confidence).toBe("high");
    expect(result.cfr_citation).toBe("§200.474");
    // Only the 3 expected fields should be in the result
    expect(Object.keys(result)).toEqual(["category", "confidence", "cfr_citation"]);
  });

  it("returns default when cfr_citation is boolean", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ category: "supplies", confidence: "medium", cfr_citation: true }),
          },
        },
      ],
    });

    const { categorizeExpense } = await import("./categorize");

    const result = await categorizeExpense("system prompt", {
      vendor: "Test",
      description: "Test",
      amount: 100,
    });

    expect(result.cfr_citation).toBe("§200.420");
  });

  it('passes model "gpt-4o-mini" to OpenAI create()', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "other", confidence: "low", cfr_citation: "§200.420" }) } }],
    });

    const { categorizeExpense } = await import("./categorize");
    await categorizeExpense("system prompt", { vendor: "V", description: "D", amount: 1 });

    expect(mockCreate.mock.calls[0][0]).toHaveProperty("model", "gpt-4o-mini");
  });

  it("passes temperature 0.1 to OpenAI create()", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "other", confidence: "low", cfr_citation: "§200.420" }) } }],
    });

    const { categorizeExpense } = await import("./categorize");
    await categorizeExpense("system prompt", { vendor: "V", description: "D", amount: 1 });

    expect(mockCreate.mock.calls[0][0]).toHaveProperty("temperature", 0.1);
  });

  it("passes max_tokens 200 to OpenAI create()", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "other", confidence: "low", cfr_citation: "§200.420" }) } }],
    });

    const { categorizeExpense } = await import("./categorize");
    await categorizeExpense("system prompt", { vendor: "V", description: "D", amount: 1 });

    expect(mockCreate.mock.calls[0][0]).toHaveProperty("max_tokens", 200);
  });

  it("passes response_format json_object to OpenAI create()", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "other", confidence: "low", cfr_citation: "§200.420" }) } }],
    });

    const { categorizeExpense } = await import("./categorize");
    await categorizeExpense("system prompt", { vendor: "V", description: "D", amount: 1 });

    expect(mockCreate.mock.calls[0][0]).toHaveProperty("response_format", { type: "json_object" });
  });

  it("passes timeout 15000 as request option", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ category: "other", confidence: "low", cfr_citation: "§200.420" }) } }],
    });

    const { categorizeExpense } = await import("./categorize");
    await categorizeExpense("system prompt", { vendor: "V", description: "D", amount: 1 });

    expect(mockCreate.mock.calls[0][1]).toHaveProperty("timeout", 15_000);
  });
});
