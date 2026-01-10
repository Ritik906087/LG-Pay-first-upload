import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <div
      className={cn(
        "font-headline text-3xl font-bold tracking-tight",
        className
      )}
    >
      <span
        style={{
          background: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        LG Pay
      </span>
    </div>
  );
}
