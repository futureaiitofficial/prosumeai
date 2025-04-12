import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

interface DefaultLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
}

export default function DefaultLayout({ 
  children, 
  pageTitle, 
  pageDescription 
}: DefaultLayoutProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "2xl:ml-16" : "2xl:ml-64"
        )}>
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="grid gap-6">
              {/* Page Header */}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
                {pageDescription && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {pageDescription}
                  </p>
                )}
              </div>
              
              {/* Page Content */}
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
