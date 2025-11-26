// Mock Financial Data for Chart Demonstrations

export const monthlyRevenue = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 34000, profit: 18000 },
  { month: "Mar", revenue: 48000, expenses: 35000, profit: 13000 },
  { month: "Apr", revenue: 61000, expenses: 36000, profit: 25000 },
  { month: "May", revenue: 72000, expenses: 28000, profit: 44000 },
  { month: "Jun", revenue: 78000, expenses: 30000, profit: 48000 },
  { month: "Jul", revenue: 85000, expenses: 32000, profit: 53000 },
  { month: "Aug", revenue: 82000, expenses: 31000, profit: 51000 },
  { month: "Sep", revenue: 58000, expenses: 62000, profit: -4000 },
  { month: "Oct", revenue: 79000, expenses: 43000, profit: 36000 },
  { month: "Nov", revenue: 85000, expenses: 45000, profit: 40000 },
  { month: "Dec", revenue: 92000, expenses: 46000, profit: 46000 },
];

export const expensesByCategory = [
  { category: "Payroll", amount: 185000, percentage: 42 },
  { category: "Marketing", amount: 78000, percentage: 18 },
  { category: "Operations", amount: 65000, percentage: 15 },
  { category: "Software & Tools", amount: 45000, percentage: 10 },
  { category: "Office & Utilities", amount: 34000, percentage: 8 },
  { category: "Other", amount: 28000, percentage: 7 },
];

export const revenueByClient = [
  { client: "Acme Corp", revenue: 125000, growth: 15.3 },
  { client: "Tech Solutions", revenue: 98000, growth: 8.7 },
  { client: "Global Industries", revenue: 87000, growth: -3.2 },
  { client: "Innovation Labs", revenue: 76000, growth: 22.1 },
  { client: "StartupXYZ", revenue: 65000, growth: 45.6 },
  { client: "Others", revenue: 234000, growth: 12.4 },
];

export const cashFlow = [
  { month: "Jan", inflow: 48000, outflow: 35000, net: 13000 },
  { month: "Feb", inflow: 55000, outflow: 37000, net: 18000 },
  { month: "Mar", inflow: 52000, outflow: 39000, net: 13000 },
  { month: "Apr", inflow: 64000, outflow: 39000, net: 25000 },
  { month: "May", inflow: 58000, outflow: 41000, net: 17000 },
  { month: "Jun", inflow: 70000, outflow: 42000, net: 28000 },
  { month: "Jul", inflow: 75000, outflow: 44000, net: 31000 },
  { month: "Aug", inflow: 71000, outflow: 43000, net: 28000 },
  { month: "Sep", inflow: 77000, outflow: 45000, net: 32000 },
  { month: "Oct", inflow: 82000, outflow: 46000, net: 36000 },
  { month: "Nov", inflow: 88000, outflow: 48000, net: 40000 },
  { month: "Dec", inflow: 95000, outflow: 49000, net: 46000 },
];

export const profitMarginTrend = [
  { quarter: "Q1 2023", margin: 24.5 },
  { quarter: "Q2 2023", margin: 26.8 },
  { quarter: "Q3 2023", margin: 28.2 },
  { quarter: "Q4 2023", margin: 31.5 },
  { quarter: "Q1 2024", margin: 29.7 },
  { quarter: "Q2 2024", margin: 33.2 },
  { quarter: "Q3 2024", margin: 35.6 },
  { quarter: "Q4 2024", margin: 38.1 },
];

export const accountsReceivable = [
  { status: "Current (0-30 days)", amount: 125000, count: 24 },
  { status: "31-60 days", amount: 45000, count: 8 },
  { status: "61-90 days", amount: 23000, count: 4 },
  { status: "90+ days", amount: 12000, count: 3 },
];

export const budgetVsActual = [
  { category: "Revenue", budget: 900000, actual: 935000, variance: 3.9 },
  { category: "COGS", budget: 350000, actual: 342000, variance: -2.3 },
  { category: "Payroll", budget: 200000, actual: 185000, variance: -7.5 },
  { category: "Marketing", budget: 75000, actual: 78000, variance: 4.0 },
  { category: "Operations", budget: 60000, actual: 65000, variance: 8.3 },
  { category: "Other", budget: 50000, actual: 48000, variance: -4.0 },
];

export const kpiMetrics = [
  {
    title: "Total Revenue",
    value: "$935,000",
    change: 15.3,
    trend: "up",
    period: "vs last year",
  },
  {
    title: "Net Profit",
    value: "$342,000",
    change: 22.7,
    trend: "up",
    period: "vs last year",
  },
  {
    title: "Profit Margin",
    value: "36.5%",
    change: 4.2,
    trend: "up",
    period: "vs last year",
  },
  {
    title: "Avg Client Value",
    value: "$18,750",
    change: 8.9,
    trend: "up",
    period: "vs last year",
  },
  {
    title: "Operating Expenses",
    value: "$593,000",
    change: -3.2,
    trend: "down",
    period: "vs last year",
  },
  {
    title: "Cash Balance",
    value: "$458,000",
    change: 28.4,
    trend: "up",
    period: "vs last month",
  },
];

export const yearOverYearComparison = [
  { month: "Jan", year2023: 38000, year2024: 45000 },
  { month: "Feb", year2023: 42000, year2024: 52000 },
  { month: "Mar", year2023: 40000, year2024: 48000 },
  { month: "Apr", year2023: 49000, year2024: 61000 },
  { month: "May", year2023: 47000, year2024: 55000 },
  { month: "Jun", year2023: 56000, year2024: 67000 },
  { month: "Jul", year2023: 61000, year2024: 72000 },
  { month: "Aug", year2023: 58000, year2024: 68000 },
  { month: "Sep", year2023: 64000, year2024: 74000 },
  { month: "Oct", year2023: 68000, year2024: 79000 },
  { month: "Nov", year2023: 73000, year2024: 85000 },
  { month: "Dec", year2023: 78000, year2024: 92000 },
];

export const departmentBudgets = [
  { department: "Engineering", allocated: 250000, spent: 235000, remaining: 15000 },
  { department: "Sales", allocated: 180000, spent: 175000, remaining: 5000 },
  { department: "Marketing", allocated: 120000, spent: 118000, remaining: 2000 },
  { department: "Operations", allocated: 100000, spent: 95000, remaining: 5000 },
  { department: "Admin", allocated: 80000, spent: 72000, remaining: 8000 },
];

// Forecast data for balance projection
export const forecastData = [
  { date: "Jan 1", balance: 458000, withIncome: 506000, afterExpenses: 471000 },
  { date: "Jan 8", balance: 471000, withIncome: 519000, afterExpenses: 484000 },
  { date: "Jan 15", balance: 484000, withIncome: 532000, afterExpenses: 497000 },
  { date: "Jan 22", balance: 497000, withIncome: 545000, afterExpenses: 510000 },
  { date: "Jan 29", balance: 510000, withIncome: 558000, afterExpenses: 523000 },
  { date: "Feb 5", balance: 523000, withIncome: 571000, afterExpenses: 536000 },
  { date: "Feb 12", balance: 536000, withIncome: 584000, afterExpenses: 549000 },
  { date: "Feb 19", balance: 549000, withIncome: 597000, afterExpenses: 562000 },
  { date: "Feb 26", balance: 562000, withIncome: 610000, afterExpenses: 575000 },
  { date: "Mar 5", balance: 575000, withIncome: 623000, afterExpenses: 588000 },
  { date: "Mar 12", balance: 588000, withIncome: 636000, afterExpenses: 601000 },
  { date: "Mar 19", balance: 601000, withIncome: 649000, afterExpenses: 614000 },
];

// Sparkline data for KPI cards
export const sparklineData = {
  revenue: [38, 42, 40, 49, 55, 67, 72, 68, 74, 79, 85, 92],
  profit: [12, 15, 13, 20, 25, 30, 35, 32, 28, 35, 38, 42],
  expenses: [26, 27, 27, 29, 30, 37, 37, 36, 46, 44, 47, 50],
  margin: [24, 27, 28, 32, 30, 33, 36, 38, 35, 37, 39, 42],
  clients: [42, 44, 45, 48, 52, 55, 58, 60, 62, 65, 68, 72],
  cashBalance: [320, 340, 360, 380, 400, 415, 430, 440, 448, 455, 460, 458],
};
