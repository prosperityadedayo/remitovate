"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "./account-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Header({ onMenuClick, title = "Dashboard" }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <span className="text-lg font-semibold">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <ThemeSwitcher />
        <AccountMenu />
      </div>
    </header>
  );
}
