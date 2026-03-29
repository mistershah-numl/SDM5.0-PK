"use client";

import { AuthProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
