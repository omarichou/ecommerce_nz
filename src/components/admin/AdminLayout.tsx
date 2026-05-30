"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("admin_sidebar_collapsed");
    setSidebarCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_sidebar_collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (mounted && !isAdminLoading && !isAdminAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAdminAuthenticated, isAdminLoading, mounted, router]);

  if (!mounted || isAdminLoading || !isAdminAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-[72px]" : "ml-64")}>
          <AdminTopbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
