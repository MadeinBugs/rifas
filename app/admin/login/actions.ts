import { login } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function submitLogin(formData: FormData) {
  "use server";
  const password = formData.get("password")?.toString() || "";
  const success = await login(password);
  
  if (success) {
    redirect("/admin");
  } else {
    // Para simplificar, sem exibir erro stateful.
    redirect("/admin/login?error=1");
  }
}
