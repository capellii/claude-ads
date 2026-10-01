"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <OrganizationSwitcher
        hidePersonal
        appearance={{
          elements: {
            rootBox: "flex items-center",
            organizationSwitcherTrigger: "text-sm font-medium",
          },
        }}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
