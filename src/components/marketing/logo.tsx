import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const iconSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  const iconText = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex ${iconSize} items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 shadow-sm`}>
        <span className={`${iconText} font-bold text-white`}>GL</span>
      </div>
      <span className={`${textSize} font-bold font-display tracking-tight text-slate-900`}>
        GrantLedger
      </span>
    </Link>
  );
}
