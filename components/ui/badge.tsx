import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-900/50 border-indigo-800 text-indigo-300",
        secondary: "bg-gray-800 border-gray-700 text-gray-400",
        destructive: "bg-red-900/40 border-red-700 text-red-300",
        outline: "border-gray-700 text-gray-400 bg-transparent",
        active: "bg-indigo-600 border-indigo-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
