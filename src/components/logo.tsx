import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "font-headline font-bold tracking-tight",
        className
      )}
    >
      <span className="text-gradient">
        LG PAY
      </span>
    </div>
  );
}
