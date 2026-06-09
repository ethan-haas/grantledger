import OpenAI from "openai";
import { buildExpensePrompt } from "./prompts";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

function getOpenAI() {
  return new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY });
}

export interface CategorizationResult {
  category: string;
  confidence: "high" | "medium" | "low";
  cfr_citation: string;
}

export async function categorizeExpense(
  systemPrompt: string,
  expense: {
    vendor: string;
    description: string;
    amount: number;
    account?: string | null;
  }
): Promise<CategorizationResult> {
  const userPrompt = buildExpensePrompt(expense);

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: "json_object" },
    }, { timeout: 15_000 });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return defaultResult();
    }

    const parsed = JSON.parse(content);

    const validCategories = [
      "personnel", "fringe_benefits", "travel", "equipment", "supplies",
      "contractual", "construction", "other", "indirect_charges",
    ];

    const validConfidence = ["high", "medium", "low"];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : "other",
      confidence: validConfidence.includes(parsed.confidence) ? parsed.confidence : "low",
      cfr_citation: typeof parsed.cfr_citation === "string" ? parsed.cfr_citation : "§200.420",
    };
  } catch (error) {
    logger.error("Categorization error", error instanceof Error ? error : undefined);
    return defaultResult();
  }
}

function defaultResult(): CategorizationResult {
  return {
    category: "other",
    confidence: "low",
    cfr_citation: "§200.420",
  };
}
