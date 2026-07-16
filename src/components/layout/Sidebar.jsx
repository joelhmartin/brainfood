"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  Settings,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "../../config/routes.js";
import { PERMISSIONS } from "../../config/roles.js";
import { usePermission } from "../../hooks/usePermission.js";
import { useSettingsStore } from "../../stores/settings.store.js";

/**
 * Permission strings must exist in config/roles.js. The previous version checked for
 * "users:read" and "settings:read" while the roles table only defined "manage_members"
 * and "view_dashboard", so those links could never render — on top of `can()` being
 * broken outright.
 */
const NAV = [
  { label: "Dashboard", to: ROUTES.DASHBOARD, icon: LayoutDashboard, end: true, permission: null },
  { label: "Events", to: ROUTES.EVENTS, icon: CalendarDays, permission: PERMISSIONS.CONTENT_READ },
  { label: "Blog Posts", to: ROUTES.POSTS, icon: FileText, permission: PERMISSIONS.CONTENT_READ },
  { label: "Members", to: ROUTES.MEMBERS, icon: Users, permission: PERMISSIONS.USERS_READ },
  { label: "Settings", to: ROUTES.SETTINGS, icon: Settings, permission: PERMISSIONS.SETTINGS_READ },
];

export function Sidebar() {
  const { can } = usePermission();
  const siteName = useSettingsStore((s) => s.settings.shortName || s.settings.name);
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold text-gray-900">{siteName}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ label, to, icon: Icon, end, permission }) => {
          if (permission && !can(permission)) return null;
          const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              href={to}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <ExternalLink size={14} />
          View site
        </a>
      </div>
    </aside>
  );
}
