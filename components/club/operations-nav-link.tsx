"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { operationsTabsStorageKey } from "./operations-tabs";

const VALID_ADMIN_KEYS = new Set([
  "overview",
  "entry",
  "capacity",
  "sell",
  "transactions",
]);

const VALID_STAFF_KEYS = new Set([
  "overview",
  "entry",
  "capacity",
  "sell",
  "transactions",
  "products",
]);

const COLD_START_KEY = "entry";

function keyToPath(basePath: string, key: string) {
  if (key === "overview") return basePath;
  return `${basePath}/${key}`;
}

interface OperationsNavLinkProps {
  portal: "admin" | "staff";
  clubSlug: string;
  className?: string;
  children: ReactNode;
}

export function OperationsNavLink({
  portal,
  clubSlug,
  className,
  children,
}: OperationsNavLinkProps) {
  const router = useRouter();
  const basePath = `/${clubSlug}/${portal}/operations`;
  const fallbackHref = `${basePath}/${COLD_START_KEY}`;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (typeof window === "undefined") return;

    e.preventDefault();

    const validKeys = portal === "admin" ? VALID_ADMIN_KEYS : VALID_STAFF_KEYS;
    let key = COLD_START_KEY;
    try {
      const stored = window.localStorage.getItem(operationsTabsStorageKey(portal));
      if (stored && validKeys.has(stored)) {
        key = stored;
      }
    } catch {
      // localStorage unavailable; use cold-start default.
    }

    router.push(keyToPath(basePath, key));
  };

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
