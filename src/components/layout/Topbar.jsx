"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth.js";
import { Avatar } from "../ui/Avatar.jsx";
import { Dropdown, DropdownItem } from "../ui/Dropdown.jsx";
import { ROUTES } from "../../config/routes.js";
import { useSettingsStore } from "../../stores/settings.store.js";

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const siteName = useSettingsStore((s) => s.settings.name);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <span className="text-sm text-gray-500">{siteName}</span>

      <Dropdown
        align="right"
        trigger={
          <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50">
            <Avatar name={user?.name} size="sm" />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </button>
        }
      >
        <DropdownItem onClick={() => router.push(ROUTES.SETTINGS)}>Settings</DropdownItem>
        <DropdownItem onClick={handleLogout}>Log out</DropdownItem>
      </Dropdown>
    </header>
  );
}
