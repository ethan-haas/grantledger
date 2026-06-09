import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: { marginTop: 15, marginBottom: 15 },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8, color: "#1e293b" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  label: { fontSize: 9, color: "#64748b" },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e293b" },
});

interface ThresholdSummaryProps {
  framework: string;
}

export function ThresholdSummary({ framework }: ThresholdSummaryProps) {
  const isPost = framework === "post_oct_2024";

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        Applicable Thresholds ({isPost ? "Post-Oct 2024" : "Pre-Oct 2024"})
      </Text>
      <View style={styles.row}>
        <Text style={styles.label}>Equipment Minimum</Text>
        <Text style={styles.value}>{isPost ? "$10,000" : "$5,000"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>De Minimis Indirect Cost Rate</Text>
        <Text style={styles.value}>{isPost ? "15% MTDC" : "10% MTDC"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Subaward MTDC Exclusion</Text>
        <Text style={styles.value}>{isPost ? "$50,000" : "$25,000"}</Text>
      </View>
    </View>
  );
}
