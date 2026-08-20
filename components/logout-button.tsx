"use client";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/auth/logout" method="POST">
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}
