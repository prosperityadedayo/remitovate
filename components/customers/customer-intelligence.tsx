"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerIntelligence } from "@/types";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

interface CustomerIntelligenceProps {
  intelligence: CustomerIntelligence;
}

export function CustomerIntelligenceCards({ intelligence }: CustomerIntelligenceProps) {
  const stats = [
    {
      title: "Total Invoiced",
      value: formatCurrency(intelligence.totalInvoiced, intelligence.currency, 0),
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Paid",
      value: formatCurrency(intelligence.totalPaid, intelligence.currency, 0),
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Outstanding",
      value: formatCurrency(intelligence.totalOutstanding, intelligence.currency, 0),
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Overdue",
      value: formatCurrency(intelligence.totalOverdue, intelligence.currency, 0),
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
