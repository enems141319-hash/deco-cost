"use client";

import { useState } from "react";
import Link from "next/link";
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
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "總覽", icon: LayoutDashboard },
  { href: "/projects", label: "專案", icon: FolderOpen },
  { href: "/materials", label: "材料庫", icon: Package },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      className={cn(
        "flex min-h-0 shrink-0 flex-col border-r bg-background transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-56"
      )}
    >
      <div className={cn("flex items-center gap-2 border-b px-3 py-3", collapsed && "justify-center")}>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <Link href="/dashboard" className="block truncate text-lg font-bold tracking-tight text-primary">
              DecoCost
            </Link>
            <p className="truncate text-[10px] text-muted-foreground">裝修成本估算</p>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 lg:inline-flex"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {!collapsed && <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />}
          </Link>
        ))}
      </nav>

      <Separator />

      <div className="space-y-1 px-3 py-3">
        {!collapsed && (
          <>
            <p className="truncate px-2 text-xs font-medium">{user.name}</p>
            <p className="truncate px-2 text-[10px] text-muted-foreground">{user.email}</p>
          </>
        )}
        <form action={logoutUser}>
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-1 h-8 w-full text-muted-foreground", collapsed ? "justify-center px-0" : "justify-start")}
            type="submit"
            title={collapsed ? "登出" : undefined}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>登出</span>}
          </Button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted/20 lg:flex">
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="開啟選單">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="font-bold text-primary">DecoCost</Link>
      </div>

      <div className="hidden lg:flex lg:min-h-screen">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
            aria-label="關閉選單"
          />
          <div className="relative h-full w-64 bg-background shadow-xl">{sidebar}</div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
