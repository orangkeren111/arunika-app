import React from "react";
import ExportExcelClientPage from "./ExportExcelClientPage";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ExportExcelClientPage bookId={resolvedParams.id} />;
}
