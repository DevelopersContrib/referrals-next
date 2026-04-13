import { redirect } from "next/navigation";

// PHP had /plans route — redirect to /pricing
export default function PlansPage() {
  redirect("/pricing");
}
