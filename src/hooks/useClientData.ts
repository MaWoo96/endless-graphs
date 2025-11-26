"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Transaction, MonthlyData, CategoryData, CashFlowData } from "@/lib/supabase/types";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ClientDataState {
  client: Client | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface AggregatedData {
  monthlyRevenue: MonthlyData[];
  expensesByCategory: CategoryData[];
  cashFlow: CashFlowData[];
  kpiMetrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    transactionCount: number;
    avgTransactionSize: number;
  };
}

export function useClientData(dateRange?: DateRange) {
  const [state, setState] = useState<ClientDataState>({
    client: null,
    transactions: [],
    isLoading: true,
    error: null,
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // Get client record for this user
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (clientError) {
        throw clientError;
      }

      // Check if client exists
      if (!clients || clients.length === 0) {
        setState({
          client: null,
          transactions: [],
          isLoading: false,
          error: "No client profile found. Please complete onboarding.",
        });
        return;
      }

      const client = clients[0];

      // Build transaction query
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("client_id", client.id)
        .order("date", { ascending: false });

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte("date", dateRange.startDate.toISOString().split("T")[0])
          .lte("date", dateRange.endDate.toISOString().split("T")[0]);
      }

      const { data: transactions, error: txError } = await query;
      if (txError) throw txError;

      setState({
        client,
        transactions: transactions || [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch data",
      }));
    }
  }, [supabase, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function useAggregatedData(transactions: Transaction[]): AggregatedData {
  // Aggregate transactions into chart-ready data
  const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
  const categoryMap = new Map<string, number>();
  let totalRevenue = 0;
  let totalExpenses = 0;

  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", { month: "short" });

    // In Plaid, negative amounts are typically income, positive are expenses
    const isIncome = tx.amount < 0;
    const amount = Math.abs(tx.amount);

    // Monthly aggregation
    const existing = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0 };
    if (isIncome) {
      existing.revenue += amount;
      totalRevenue += amount;
    } else {
      existing.expenses += amount;
      totalExpenses += amount;
    }
    monthlyMap.set(monthKey, existing);

    // Category aggregation (for expenses)
    if (!isIncome && tx.coa_keywords) {
      const cat = tx.coa_keywords;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
    } else if (!isIncome && tx.category && tx.category.length > 0) {
      const cat = tx.category[0];
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
    }
  });

  // Convert to arrays and sort
  const monthlyRevenue: MonthlyData[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleString("default", { month: "short" }),
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses),
        profit: Math.round(data.revenue - data.expenses),
      };
    });

  // Category data
  const totalCategoryAmount = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  const expensesByCategory: CategoryData[] = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: Math.round((amount / totalCategoryAmount) * 100),
    }));

  // Cash flow data (same as monthly but formatted differently)
  const cashFlow: CashFlowData[] = monthlyRevenue.map((m) => ({
    month: m.month,
    inflow: m.revenue,
    outflow: m.expenses,
    net: m.profit,
  }));

  // KPI metrics
  const kpiMetrics = {
    totalRevenue: Math.round(totalRevenue),
    totalExpenses: Math.round(totalExpenses),
    netProfit: Math.round(totalRevenue - totalExpenses),
    transactionCount: transactions.length,
    avgTransactionSize: transactions.length > 0
      ? Math.round(transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length)
      : 0,
  };

  return {
    monthlyRevenue,
    expensesByCategory,
    cashFlow,
    kpiMetrics,
  };
}

export function useUser() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id, email: user.email || "" } : null);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email || "" } : null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isLoading, signOut };
}
