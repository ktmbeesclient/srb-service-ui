// src/api/exportTransactions.ts

import { getCookie } from "cookies-next/client";

export interface ExportTransactionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  types?: string[];
  startDate?: string;
  endDate?: string;
  clientId?: string;
  year?: string;
  vatPeriod?: string;
}

/**
 * Shared helper to convert params into a standard URL query string.
 */
function buildExportQuery(params: ExportTransactionsParams): string {
  const qs = new URLSearchParams();

  // Only set page/page_size when explicitly provided — their absence
  // means "export everything," not "default to page 1."
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.pageSize !== undefined) qs.set("page_size", String(params.pageSize));

  if (params.search) qs.set("search", params.search);
  if (params.types?.length) qs.set("types", params.types.join(","));
  if (params.startDate) qs.set("start_date", params.startDate);
  if (params.endDate) qs.set("end_date", params.endDate);
  if (params.clientId) qs.set("client_id", params.clientId);
  if (params.year) qs.set("year", params.year);
  if (params.vatPeriod) qs.set("vat_period", params.vatPeriod);

  return qs.toString();
}

/**
 * Triggers browser download of the compiled PDF Report asset file.
 */
export async function exportTransactionsPDF(
  params: ExportTransactionsParams
): Promise<void> {
  const query = buildExportQuery(params);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = getCookie("access_token") as string;

  if (!token) {
    throw new Error("Access token not found.");
  }

  // Update endpoint URL to match your Go controller routing context
  const response = await fetch(`${apiUrl}/export/export-pdf?${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await response.json();
     
      throw new Error(body?.message || body?.error || "Failed to export PDF report");
    }

    throw new Error(`PDF Export failed with status ${response.status}`);
  }

  // Parse custom dynamic file metadata sent by Go context headers
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `VAT_Report_${new Date().toISOString().split("T")[0]}.pdf`;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Trigger immediate programmatic browser client download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser download of the generated Excel Report asset file.
 */
export async function exportTransactionsExcel(
  params: ExportTransactionsParams
): Promise<void> {
  const query = buildExportQuery(params);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = getCookie("access_token") as string;

  if (!token) {
    throw new Error("Access token not found.");
  }

  const response = await fetch(`${apiUrl}/export/export-excel?${query}`, {
    
    method: "GET",
    
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await response.json();
      throw new Error(body?.message || body?.error || "Failed to export transactions");
    }

    throw new Error(`Export failed with status ${response.status}`);
  }

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `VAT_Books_${new Date().toISOString().split("T")[0]}.xlsx`;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}