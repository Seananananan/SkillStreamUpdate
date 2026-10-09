import { Suspense } from "react";
import { RoleChoice } from "@/components/auth/RoleChoice";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <RoleChoice next={next} />
    </Suspense>
  );
}
