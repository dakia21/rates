import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      danger: "bg-destructive text-destructive-foreground font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:bg-destructive/90 active:scale-[0.98]",
      outline: "border border-border font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:bg-secondary active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "",
      lg: "px-8 py-3 text-lg",
      icon: "p-2.5 aspect-square",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          loading && "opacity-70 cursor-wait",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
