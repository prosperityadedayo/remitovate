"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSignedLogoUrl } from "@/app/actions/upload";

export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        setEmail(user.email ?? null);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;

        const { data: business } = await supabase
          .from("businesses")
          .select("logo_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (business?.logo_url) {
          const signed = await getSignedLogoUrl(business.logo_url);
          setLogoUrl(signed);
        }
      } catch {
        // Silently fail - logo is optional
      }
    };
    fetchLogo();
  }, []);

  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : "??";

  const displayName = email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={logoUrl || ""} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email || "user@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Building2 className="mr-2 h-4 w-4" />
          Business
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth/login";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
