import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate } from "@/lib/constants/thresholds";

const styles = StyleSheet.create({
  section: { marginBottom: 15 },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8, color: "#1e293b" },
  pageInfo: { fontSize: 8, color: "#94a3b8", marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#e2e8f0" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase" },
  colDate: { width: "12%", fontSize: 8 },
  colVendor: { width: "18%", fontSize: 8 },
  colDesc: { width: "25%", fontSize: 8 },
  colAmount: { width: "12%", fontSize: 8, textAlign: "right" },
  colCfr: { width: "10%", fontSize: 8 },
  colConf: { width: "8%", fontSize: 8 },
  colBy: { width: "15%", fontSize: 7 },
});

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

interface ExpenseItem {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  ai_confidence: string | null;
  ai_cfr_citation: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

interface ExpenseDetailProps {
  category: string;
  expenses: ExpenseItem[];
  pageNumber: number;
  totalPages: number;
}

export function ExpenseDetail({ category, expenses, pageNumber, totalPages }: ExpenseDetailProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {CATEGORY_LABELS[category] || category} Expenses
      </Text>
      {totalPages > 1 && (
        <Text style={styles.pageInfo}>
          Page {pageNumber} of {totalPages} ({expenses.length} expenses)
        </Text>
      )}
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.colDate, styles.headerText]}>Date</Text>
          <Text style={[styles.colVendor, styles.headerText]}>Vendor</Text>
          <Text style={[styles.colDesc, styles.headerText]}>Description</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          <Text style={[styles.colCfr, styles.headerText]}>CFR</Text>
          <Text style={[styles.colConf, styles.headerText]}>Conf.</Text>
          <Text style={[styles.colBy, styles.headerText]}>Confirmed By</Text>
        </View>
        {expenses.map((e, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.colDate}>{formatDate(e.date)}</Text>
            <Text style={styles.colVendor}>{e.vendor.substring(0, 25)}</Text>
            <Text style={styles.colDesc}>{e.description.substring(0, 40)}</Text>
            <Text style={styles.colAmount}>
              ${e.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.colCfr}>{e.ai_cfr_citation || ""}</Text>
            <Text style={styles.colConf}>{e.ai_confidence || ""}</Text>
            <Text style={styles.colBy}>
              {e.confirmed_by ? `${e.confirmed_by.substring(0, 12)}` : ""}
              {e.confirmed_at ? ` ${formatDate(e.confirmed_at)}` : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
