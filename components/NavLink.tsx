"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "flex items-center gap-1.5",
        isActive ? "text-white bg-gray-800" : "text-gray-400"
      )}
    >
      {children}
    </Link>
  );
}
