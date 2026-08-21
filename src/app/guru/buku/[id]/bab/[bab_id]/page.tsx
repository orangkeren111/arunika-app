import React from "react";
import BankSoalClientPage from "./BankSoalClientPage";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; bab_id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <BankSoalClientPage
      id={resolvedParams.id}
      babId={resolvedParams.bab_id}
    />
  );
}
