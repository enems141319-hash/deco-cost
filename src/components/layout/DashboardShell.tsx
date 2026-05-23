"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/actions/auth";

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  projects?: SidebarProject[];
  children: React.ReactNode;
}

interface SidebarProject {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "總覽", icon: LayoutDashboard },
  { href: "/projects", label: "專案", icon: FolderOpen },
  { href: "/materials", label: "材料管理", icon: Package },
];

export function DashboardShell({ user, projects = [], children }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderSidebar = (forceExpanded = false) => {
    const isCollapsed = !forceExpanded && collapsed;

    return (
      <aside
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col border-r bg-background transition-[width] duration-200",
          isCollapsed ? "w-[68px]" : "w-56"
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center gap-2 border-b px-3", isCollapsed && "justify-center")}>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <Link href="/dashboard" className="block truncate text-lg font-bold tracking-tight text-primary">
                DecoCost
              </Link>
              <p className="truncate text-[10px] text-muted-foreground">裝修材料估價系統</p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={isCollapsed ? "展開側欄" : "收合側欄"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isProjectsNav = href === "/projects";
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                  {!isCollapsed && <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />}
                </Link>
                {isProjectsNav && !isCollapsed && projects.length > 0 && (
                  <div className="mt-1 space-y-0.5 border-l border-border/80 pl-3 ml-4">
                    {projects.map((project) => {
                      const href = `/projects/${project.id}`;
                      const projectActive = pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <Link
                          key={project.id}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                            projectActive && "bg-accent/80 font-medium text-accent-foreground"
                          )}
                        >
                          <span className="block truncate">{project.name}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">{project.itemCount} 筆估價</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0">
          <Separator />
          <div className="space-y-1 px-3 py-3">
            {!isCollapsed && (
              <>
                <p className="truncate px-2 text-xs font-medium">{user.name}</p>
                <p className="truncate px-2 text-[10px] text-muted-foreground">{user.email}</p>
              </>
            )}
            <form action={logoutUser}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("mt-1 h-8 w-full text-muted-foreground", isCollapsed ? "justify-center px-0" : "justify-start")}
                type="submit"
                title={isCollapsed ? "登出" : undefined}
              >
                <LogOut className="h-3.5 w-3.5" />
                {!isCollapsed && <span>登出</span>}
              </Button>
            </form>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 lg:flex lg:h-screen lg:overflow-hidden">
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="開啟選單">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="font-bold text-primary">DecoCost</Link>
      </div>

      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
        {renderSidebar()}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
            aria-label="關閉選單"
          />
          <div className="relative h-full w-64 bg-background shadow-xl">{renderSidebar(true)}</div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
