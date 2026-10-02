"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  BarChart3,
  Settings,
  Link2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

function AnasyLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <polygon points="13,2 24,22 2,22" fill="#2563EB" />
      <polygon points="13,6 20,20 6,20" fill="#1B3A8C" />
      <polygon points="13,10 17.5,18.5 8.5,18.5" fill="#3B82F6" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/dashboard/runs", label: "Runs", icon: Play },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/connections", label: "Conexões", icon: Link2 },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="flex h-full w-60 flex-col"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div
        className="flex h-14 items-center gap-2.5 px-4"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <AnasyLogo />
        <div>
          <p className="text-sm font-bold tracking-wider" style={{ color: "var(--sidebar-fg)" }}>
            ANASY
          </p>
          <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: "var(--sidebar-muted)" }}>
            Ads Platform
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              )}
              style={{
                background: active ? "var(--sidebar-active-bg)" : "transparent",
                color: active ? "var(--sidebar-active-fg)" : "var(--sidebar-muted)",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover-bg)";
                if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-fg)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-muted)";
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={active ? "font-medium" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <p className="text-[10px] tracking-wide" style={{ color: "var(--sidebar-muted)" }}>
          Analytics Systems
        </p>
      </div>
    </aside>
  );
}
