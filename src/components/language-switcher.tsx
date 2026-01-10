"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-sm text-foreground/80 hover:text-foreground"
    >
      <Globe className="h-4 w-4" />
      <span>English</span>
    </Button>
  );
}
