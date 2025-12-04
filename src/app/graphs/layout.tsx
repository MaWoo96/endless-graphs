"use client";

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

export default function GraphsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedEntity, tenantName } = useEntityContext();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with breadcrumb */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-300 dark:bg-gray-700" />
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
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
