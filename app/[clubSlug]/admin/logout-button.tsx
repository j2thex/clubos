"use client";

import { useTransition } from "react";
import { logoutOwner } from "./actions";

export function LogoutButton({ clubSlug }: { clubSlug: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutOwner(clubSlug))}
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
