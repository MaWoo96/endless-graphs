"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, Transaction, MonthlyData, CategoryData, CashFlowData } from "@/lib/supabase/types";

// Pagination constants - prevents loading unbounded transactions
const PAGE_SIZE = 500;
const MAX_PAGES = 10; // Safety limit: max 5,000 transactions

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ClientDataState {
  client: Client | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number | null;
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

export function useClientData(dateRange?: DateRange, entityId?: string | null) {
  const [state, setState] = useState<ClientDataState>({
    client: null,
    transactions: [],
    isLoading: true,
    error: null,
    hasMore: false,
    totalCount: null,
  });
  const [currentPage, setCurrentPage] = useState(0);

  const supabase = createClient();

  const fetchData = useCallback(async (page = 0, append = false) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      // Clear transactions if this is a fresh fetch (not appending)
      ...(append ? {} : { transactions: [] })
    }));

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // First try new multi-tenant schema: users table with auth_user_id
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .limit(1);

      if (!usersError && users && users.length > 0) {
        // New multi-tenant schema
        const dbUser = users[0];

        // Get tenant via tenant_users junction table (separate queries to avoid RLS issues)
        const { data: tenantUsers, error: tuError } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", dbUser.id)
          .limit(1);

        if (tuError) throw tuError;

        const tenantUser = tenantUsers?.[0];

        // Get tenant details separately
        let tenant = null;
        if (tenantUser?.tenant_id) {
          const { data: tenants } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", tenantUser.tenant_id)
            .limit(1);
          tenant = tenants?.[0];
        }

        // Get entity - either the specified one or fetch from tenant
        let entity = null;

        if (entityId) {
          // Use the specified entity ID directly
          const { data: entityData, error: entityError } = await supabase
            .from("entities")
            .select("*")
            .eq("id", entityId)
            .limit(1);

          if (entityError) throw entityError;
          entity = entityData?.[0];
        } else {
          // Fallback: get first entity for this user's tenant
          const { data: entities, error: entitiesError } = await supabase
            .from("entities")
            .select("*")
            .eq("tenant_id", tenant?.id)
            .limit(1);

          if (entitiesError) throw entitiesError;
          entity = entities?.[0];
        }

        // Create a client-like object for backwards compatibility
        const client: Client = {
          id: entity?.id || dbUser.id,
          user_id: user.id,
          business_name: entity?.name || tenant?.name || `${dbUser.first_name} ${dbUser.last_name}`,
          company_name: entity?.name || tenant?.name || null,
          email: dbUser.email || '',
          created_at: dbUser.created_at,
          entity_type: null,
          ein: null,
          first_name: dbUser.first_name || null,
          last_name: dbUser.last_name || null,
          phone: null,
          industry: null,
          role: null,
          team_size: null,
          monthly_revenue: null,
          goals: null,
          challenges: null,
          airtable_base_id: null,
          industry_profile_id: null,
          updated_at: null,
        };

        // Build transaction query using entity_id with pagination
        const rangeStart = page * PAGE_SIZE;
        const rangeEnd = rangeStart + PAGE_SIZE - 1;

        let query = supabase
          .from("transactions")
          .select("*", { count: "exact" })
          .eq("entity_id", entity?.id)
          .order("date", { ascending: false })
          .range(rangeStart, rangeEnd);

        // Apply date range filter if provided
        if (dateRange) {
          query = query
            .gte("date", dateRange.startDate.toISOString().split("T")[0])
            .lte("date", dateRange.endDate.toISOString().split("T")[0]);
        }

        const { data: transactions, error: txError, count } = await query;
        if (txError) throw txError;

        const fetchedTransactions = transactions || [];
        const hasMore = count !== null && rangeEnd < count - 1 && page < MAX_PAGES - 1;

        setState(prev => ({
          client,
          transactions: append
            ? [...prev.transactions, ...fetchedTransactions]
            : fetchedTransactions,
          isLoading: false,
          error: null,
          hasMore,
          totalCount: count,
        }));
        setCurrentPage(page);
        return;
      }

      // Fallback to legacy clients table
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
          hasMore: false,
          totalCount: null,
        });
        return;
      }

      const client = clients[0];

      // Build transaction query using client_id (legacy) with pagination
      const rangeStart = page * PAGE_SIZE;
      const rangeEnd = rangeStart + PAGE_SIZE - 1;

      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .range(rangeStart, rangeEnd);

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte("date", dateRange.startDate.toISOString().split("T")[0])
          .lte("date", dateRange.endDate.toISOString().split("T")[0]);
      }

      const { data: transactions, error: txError, count } = await query;
      if (txError) throw txError;

      const fetchedTransactions = transactions || [];
      const hasMore = count !== null && rangeEnd < count - 1 && page < MAX_PAGES - 1;

      setState(prev => ({
        client,
        transactions: append
          ? [...prev.transactions, ...fetchedTransactions]
          : fetchedTransactions,
        isLoading: false,
        error: null,
        hasMore,
        totalCount: count,
      }));
      setCurrentPage(page);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch data",
        hasMore: false,
        totalCount: null,
      }));
    }
  }, [supabase, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), entityId]);

  // Load more transactions (for infinite scroll or "load more" button)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading) {
      fetchData(currentPage + 1, true);
    }
  }, [fetchData, currentPage, state.hasMore, state.isLoading]);

  useEffect(() => {
    // Reset to page 0 when date range changes
    setCurrentPage(0);
    fetchData(0, false);
  }, [fetchData]);

  return {
    ...state,
    refetch: () => fetchData(0, false),
    loadMore,
    currentPage,
  };
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

  // Convert to arrays and sort - use ALL filtered transactions (date range already applied)
  const monthlyRevenue: MonthlyData[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id, email: user.email || "" } : null);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        // Redirect to login page after sign out
        router.push("/login");
      } else {
        setUser(session?.user ? { id: session.user.id, email: session.user.email || "" } : null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      // The onAuthStateChange handler will redirect to /login
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return { user, isLoading, isSigningOut, signOut };
}
