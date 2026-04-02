import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <Image
        src="https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/30297-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvMzAyOTctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NzUxNTM5MTQsImV4cCI6MTgwNjY4OTkxNH0.VfdWT_qcizXAxDiRfArTFBYeStKewpXM3FFwwpZSlPE"
        width={160}
        height={50}
        alt="LG Pay Logo"
        priority
      />
    </div>
  );
}
