import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatPeriodDate } from "@/lib/constants/thresholds";

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 4,
  },
  infoItem: {
    width: "48%",
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    color: "#1e293b",
    fontFamily: "Helvetica-Bold",
  },
});

interface ReportHeaderProps {
  grant: {
    name: string;
    funding_agency: string;
    cfda_number: string | null;
    award_number: string | null;
    period_start: string;
    period_end: string;
    omb_framework: string;
    total_amount: number;
  };
  generatedAt: string;
}

export function ReportHeader({ grant, generatedAt }: ReportHeaderProps) {
  const frameworkLabel = grant.omb_framework === "post_oct_2024"
    ? "Post-Oct 2024 Rules"
    : "Pre-Oct 2024 Rules";

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Grant Compliance Report</Text>
      <Text style={styles.subtitle}>{grant.name} — {grant.funding_agency}</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>CFDA Number</Text>
          <Text style={styles.value}>{grant.cfda_number || "N/A"}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Award Number</Text>
          <Text style={styles.value}>{grant.award_number || "N/A"}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Period</Text>
          <Text style={styles.value}>
            {formatPeriodDate(grant.period_start)} - {formatPeriodDate(grant.period_end)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>OMB Framework</Text>
          <Text style={styles.value}>{frameworkLabel}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Total Award</Text>
          <Text style={styles.value}>
            ${grant.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Report Generated</Text>
          <Text style={styles.value}>{new Date(generatedAt).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}
