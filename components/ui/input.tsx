"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    if (type === "password") {
      return (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex w-full rounded-xl bg-card border border-border px-4 py-3 pr-10 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-indigo-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-indigo-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
