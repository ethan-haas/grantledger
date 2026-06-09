import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReportHeader } from "./templates/report-header";
import { BudgetSummaryTable } from "./templates/budget-summary-table";
import { ExpenseDetail } from "./templates/expense-detail";
import { ThresholdSummary } from "./templates/threshold-summary";
import { Disclaimer } from "./templates/disclaimer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
});

interface GrantInfo {
  name: string;
  funding_agency: string;
  cfda_number: string | null;
  award_number: string | null;
  period_start: string;
  period_end: string;
  omb_framework: string;
  total_amount: number;
}

interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
}

interface ExpenseItem {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  confirmed_category: string;
  ai_confidence: string | null;
  ai_cfr_citation: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

interface ReportData {
  grant: GrantInfo;
  budgetLines: BudgetLine[];
  expenses: ExpenseItem[];
  generatedAt: string;
}

export function GrantComplianceReport({ grant, budgetLines, expenses, generatedAt }: ReportData) {
  // Group expenses by category
  const expensesByCategory: Record<string, ExpenseItem[]> = {};
  expenses.forEach((e) => {
    const cat = e.confirmed_category || "other";
    if (!expensesByCategory[cat]) expensesByCategory[cat] = [];
    expensesByCategory[cat].push(e);
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <ReportHeader grant={grant} generatedAt={generatedAt} />
        <BudgetSummaryTable lines={budgetLines} />
        <ThresholdSummary framework={grant.omb_framework} />
      </Page>

      {Object.entries(expensesByCategory).map(([category, catExpenses]) => {
        // Paginate at 500 per section
        const pages = [];
        for (let i = 0; i < catExpenses.length; i += 500) {
          pages.push(catExpenses.slice(i, i + 500));
        }

        return pages.map((pageExpenses, pageIdx) => (
          <Page key={`${category}-${pageIdx}`} size="LETTER" style={styles.page}>
            <ExpenseDetail
              category={category}
              expenses={pageExpenses}
              pageNumber={pageIdx + 1}
              totalPages={pages.length}
            />
          </Page>
        ));
      })}

      <Page size="LETTER" style={styles.page}>
        <Disclaimer />
      </Page>
    </Document>
  );
}
