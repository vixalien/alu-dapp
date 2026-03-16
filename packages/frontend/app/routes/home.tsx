import { redirect } from "react-router";

export default function Home() {
  return null;
}

export function clientLoader() {
  return redirect("/dashboard");
}
