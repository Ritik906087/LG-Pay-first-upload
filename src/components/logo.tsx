import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "font-headline text-3xl font-bold tracking-tight",
        className
      )}
    >
      <span className="bg-gradient-to-r from-accent via-[#ff6fd8] to-primary bg-clip-text text-transparent">
        LG PAY
      </span>
    </div>
  );
}
