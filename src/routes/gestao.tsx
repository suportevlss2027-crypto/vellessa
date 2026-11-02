import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestao")({
  loader: () => {
    throw redirect({ to: "/admin/login" });
  },
  component: () => null,
});
