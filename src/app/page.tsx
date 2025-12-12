import { redirect } from "next/navigation";

// Redirect directly to the dashboard - skip the tile menu
export default function HomePage() {
  redirect("/graphs");
}
