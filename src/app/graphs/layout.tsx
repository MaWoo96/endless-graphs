"use client";

import { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEntityContext } from "@/contexts/EntityContext";
import { Loader2 } from "lucide-react";
import { MobileBottomNav, MobileBottomNavSpacer } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

function SidebarFallback() {
  return (
    <div className="hidden md:flex h-screen w-64 items-center justify-center bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

export default function GraphsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedEntity, tenantName } = useEntityContext();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Suspense fallback={<SidebarFallback />}>
          <AppSidebar />
        </Suspense>
      </div>
      
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header with breadcrumb - simplified on mobile, z-index below sidebar */}
        <header className="flex h-12 md:h-12 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30">
          <div className="flex items-center gap-2 px-3 md:px-4 w-full">
            {/* Sidebar trigger - only on desktop */}
            <SidebarTrigger className="hidden md:flex -ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Separator orientation="vertical" className="hidden md:block mr-2 h-4 bg-gray-300 dark:bg-gray-700" />
            
            {/* Mobile: Show entity name prominently */}
            {isMobile ? (
              <div className="flex-1">
                <h1 className="font-semibold text-navy-dark dark:text-white truncate">
                  {selectedEntity?.name || tenantName || "Dashboard"}
                </h1>
              </div>
            ) : (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/graphs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      {tenantName || "Dashboard"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {selectedEntity && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block text-gray-400 dark:text-gray-600" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">{selectedEntity.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        
        {/* Mobile bottom nav spacer */}
        <MobileBottomNavSpacer />
      </SidebarInset>
      
      {/* Mobile bottom navigation - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </SidebarProvider>
  );
}
