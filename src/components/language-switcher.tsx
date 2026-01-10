"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("English");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-sm text-foreground/80 hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          <span>{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white/90 backdrop-blur-sm">
        <DropdownMenuItem onSelect={() => setLanguage("English")}>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage("हिंदी")}>
          <span>हिंदी</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage("اردو")}>
          <span>اردو</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
