"use server";

import { logout } from "@/lib/auth";

export async function logoutAction(): Promise<void> {
  await logout();
}
