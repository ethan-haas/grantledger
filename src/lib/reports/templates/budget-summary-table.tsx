import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 10, color: "#1e293b" },
  table: { borderWidth: 1, borderColor: "#e2e8f0" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  colCategory: { width: "30%", fontSize: 9 },
  colAmount: { width: "17.5%", fontSize: 9, textAlign: "right" },
  headerText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  totalText: { fontFamily: "Helvetica-Bold" },
});

interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  personnel: "Personnel",
  fringe_benefits: "Fringe Benefits",
  travel: "Travel",
  equipment: "Equipment",
  supplies: "Supplies",
  contractual: "Contractual",
  construction: "Construction",
  other: "Other",
  indirect_charges: "Indirect Charges",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BudgetSummaryTable({ lines }: { lines: BudgetLine[] }) {
  const totals = lines.reduce(
    (acc, l) => ({
      budgeted: acc.budgeted + l.budgeted,
      spent: acc.spent + l.spent,
      remaining: acc.remaining + l.remaining,
    }),
    { budgeted: 0, spent: 0, remaining: 0 }
  );

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Budget-to-Actual Summary</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.colCategory, styles.headerText]}>Category</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Budgeted</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Spent</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Remaining</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Util. %</Text>
        </View>
        {lines.filter(l => l.category !== "total").map((line) => (
          <View key={line.category} style={styles.row}>
            <Text style={styles.colCategory}>{CATEGORY_LABELS[line.category] || line.category}</Text>
            <Text style={styles.colAmount}>{fmt(line.budgeted)}</Text>
            <Text style={styles.colAmount}>{fmt(line.spent)}</Text>
            <Text style={[styles.colAmount, line.remaining < 0 ? { color: "#dc2626" } : {}]}>
              {fmt(line.remaining)}
            </Text>
            <Text style={styles.colAmount}>{line.utilization.toFixed(1)}%</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.colCategory, styles.totalText]}>Total</Text>
          <Text style={[styles.colAmount, styles.totalText]}>{fmt(totals.budgeted)}</Text>
          <Text style={[styles.colAmount, styles.totalText]}>{fmt(totals.spent)}</Text>
          <Text style={[styles.colAmount, styles.totalText]}>{fmt(totals.remaining)}</Text>
          <Text style={[styles.colAmount, styles.totalText]}>
            {totals.budgeted > 0 ? ((totals.spent / totals.budgeted) * 100).toFixed(1) : "0.0"}%
          </Text>
        </View>
      </View>
    </View>
  );
}
