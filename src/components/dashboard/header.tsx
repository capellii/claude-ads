"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-5">
      <OrganizationSwitcher
        hidePersonal
        appearance={{
          elements: {
            rootBox: "flex items-center",
            organizationSwitcherTrigger:
              "text-sm font-medium text-foreground hover:bg-accent rounded-md px-2 py-1 transition-colors",
          },
        }}
      />

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificações</span>
        </Button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </div>
    </header>
  );
}
