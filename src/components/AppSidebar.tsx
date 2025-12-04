"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  PieChart,
  Wallet,
  Settings,
  LogOut,
  ChevronUp,
  BarChart3,
  CreditCard,
  Building2,
  Loader2,
  ScanLine,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EntityPicker } from "@/components/EntityPicker";
import { useEntityContext } from "@/contexts/EntityContext";
import { useUser, useAccounts } from "@/hooks/useClientData";
import { ThemeToggle } from "@/components/ThemeToggle";

// Navigation items for main dashboard
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/graphs",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: "/graphs?tab=transactions",
    icon: Receipt,
  },
  {
    title: "Receipts",
    url: "/graphs/receipts",
    icon: ScanLine,
  },
];

// Report items
const reportItems = [
  {
    title: "Income vs Expenses",
    url: "/graphs?section=income-expenses",
    icon: TrendingUp,
  },
  {
    title: "Cash Flow",
    url: "/graphs?section=cashflow",
    icon: Wallet,
  },
  {
    title: "Expenses by Category",
    url: "/graphs?section=expenses",
    icon: PieChart,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const { user, isSigningOut, signOut } = useUser();
  const { selectedEntity, entities, isLoading: entityLoading } = useEntityContext();
  const { accounts, isLoading: accountsLoading } = useAccounts(selectedEntity?.id || null);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "??";
    const parts = user.email.split("@")[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header with Logo and Entity Picker */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-winning-green to-teal text-white">
                <BarChart3 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Endless Graphs</span>
                <span className="truncate text-xs text-muted-foreground">
                  Financial Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Entity Picker */}
        {!isCollapsed && (
          <div className="px-2 pb-2">
            <EntityPicker />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                // Check active state based on URL and tab param
                let isActive = false;
                if (item.url === "/graphs") {
                  isActive = pathname === "/graphs" && currentTab === "dashboard";
                } else if (item.url === "/graphs?tab=transactions") {
                  isActive = pathname === "/graphs" && currentTab === "transactions";
                } else if (item.url === "/graphs/receipts") {
                  isActive = pathname === "/graphs/receipts";
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reports */}
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Connected Accounts */}
        <SidebarGroup>
          <SidebarGroupLabel>Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountsLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Loader2 className="animate-spin" />
                    <span>Loading...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : accounts.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <CreditCard />
                    <span className="text-muted-foreground">No accounts</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                accounts.map((account) => (
                  <SidebarMenuItem key={account.id}>
                    <SidebarMenuButton asChild>
                      <button className="w-full">
                        {account.type === "depository" ? (
                          <Building2 className="text-winning-green" />
                        ) : (
                          <CreditCard className="text-info-blue" />
                        )}
                        <span className="truncate">{account.name}</span>
                        {account.mask && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            ···{account.mask}
                          </span>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Menu */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* Theme Toggle */}
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!isCollapsed && (
                <span className="text-xs text-muted-foreground">Theme</span>
              )}
              <ThemeToggle />
            </div>
          </SidebarMenuItem>

          {/* User Menu */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-teal text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.email?.split("@")[0] || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || "Not signed in"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
                align="start"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  disabled={isSigningOut}
                  className="text-loss-red focus:text-loss-red cursor-pointer"
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
