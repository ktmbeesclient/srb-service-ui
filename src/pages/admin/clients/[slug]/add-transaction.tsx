import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useRouter } from "next/router";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { UserRolesEnum } from "@/utils/enums/enum";
import {
  Group,
  Text,
  Title,
  Paper,
  TextInput,
  Select,
  Checkbox,
  SimpleGrid,
  ActionIcon,
  NumberInput,
  Box,
  Table,
  Autocomplete,
  Modal,
} from "@mantine/core";

import { CommonButton } from "@/components/common";
import "nepali-datepicker-reactjs/dist/index.css";

import NepaliDatePicker from "@/components/common/NepaliDatePIcker";
import {
  FiscalYear,
  getFiscalYearFromDate,
  toRFC3339,
} from "@/utils/helpers/dateFormatter";
import {
  ApiGetTransactionById,
  ApiCreateClientTransaction,
  ApiUpdateClientTransaction,
  APIGetPartiesOrPan,
  TransactionPayload,
} from "../../../../../apis/transaction";
import { ApiGetClientBySlug } from "../../../../../apis/client";
import showNotify from "@/utils/notify";


type TxItem = {
  id: string;
  date: string;
  invoice: number;
  debitInvoice?: number;
  creditInvoice?: number;
  pan: string;
  particulars: string;
  isImport?: boolean;
  isCapitalPurchase?: boolean;
  amount: number;
  taxable: number;
  nonTaxable: number;
  vatPercent: number;
  tax: number;
  grandTotal: number;
};

type TxErrors = {
  date?: string;
  invoice?: string;
  pan?: string;
  items?: string;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const uiToApiType: Record<string, string> = {
  Sales: "SALES",
  Purchase: "PURCHASE",
  "Sales Return": "SALES_RETURN",
  "Purchase Return": "PURCHASE_RETURN",
};
const apiToUiType: Record<string, string> = {
  SALES: "Sales",
  PURCHASE: "Purchase",
  SALES_RETURN: "Sales Return",
  PURCHASE_RETURN: "Purchase Return",
};

const extractTransaction = (payload: any): any =>
  payload?.data?.data ?? payload?.data?.transaction ?? payload?.data ?? payload;

const extractErrorMessage = (source: any, fallback: string): string =>
  source?.data?.error ||
  source?.data?.message ||
  source?.response?.data?.error ||
  source?.response?.data?.message ||
  source?.message ||
  fallback;

// Helper: turns any input into a clean non-negative integer, or 0 if invalid.
const toSafeInt = (value: any): number => {
  const digitsOnly = String(value ?? "").replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const n = Math.trunc(Number(digitsOnly));
  return Number.isFinite(n) ? n : 0;
};

// Helper: PAN as a clean digit-only string (kept as string for leading-zero safety).
const toSafePan = (value: any): string => String(value ?? "").replace(/\D/g, "");

// Helper: extract client id from ApiGetClientBySlug's response, whose real
// shape is { status: 'success', client: { id, ... } } (matches the same
// defensive parsing used in ClientDetail). Deliberately does NOT fall back
// to the slug string if resolution fails — that fallback was the bug that
// caused "invalid client ID" on save, since the slug is not a valid UUID.
const resolveClientIdFromResponse = (res: any): string => {
  const body = res?.data;
  const isSuccess = body?.status === "success" || body?.success === true;
  const client = body?.client ?? body?.data;
  const resolvedId = String(client?.id ?? client?.client_id ?? client?._id ?? "");
  return isSuccess && resolvedId ? resolvedId : "";
};

const itemToPayload = (
  type: string,
  item: TxItem,
): TransactionPayload => {
  const payload: TransactionPayload = {
    transaction_type: uiToApiType[type] || "SALES",
    transaction_date: toRFC3339(item.date),
    // PAN must be exactly 9 digits to satisfy the backend's `gte` validation
    // on pan_no. A shorter numeric string (e.g. "45") used to pass a naive
    // /^\d+$/ check but produced a too-small number the backend rejects.
    // validateTxForm already blocks submission before this runs, so the
    // `: 0` branch here is a defensive fallback only.
    pan_no: /^\d{9}$/.test(item.pan) ? Number(item.pan) : 0,
    party: item.particulars,
    taxable: item.taxable,
    non_taxable: item.nonTaxable,
    vat: item.vatPercent,
    status: true,
    import: item.isImport || false,
    capital: item.isCapitalPurchase || false,
  };

  // Treat 0/undefined/null as "not provided" — invoice numbers are
  // never legitimately 0, so this avoids sending a phantom "0" string
  // that would pass the backend's non-nil checks incorrectly.
  if (item.invoice && item.invoice > 0) {
    payload.invoice_no = String(item.invoice);
  }
  if (item.debitInvoice && item.debitInvoice > 0) {
    payload.debit_invoice_no = String(item.debitInvoice);
  }
  if (item.creditInvoice && item.creditInvoice > 0) {
    payload.credit_invoice_no = String(item.creditInvoice);
  }

  return payload;
};

export default function AddTransaction() {
  const router = useRouter();
  const { slug, txId } = router.query;

  const [txFormErrors, setTxFormErrors] = useState<TxErrors>({});
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [clientResolving, setClientResolving] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [particularSuggestions, setParticularSuggestions] = useState<string[]>([]);
  const [partyPanRecords, setPartyPanRecords] = useState<{ party: string; pan: string }[]>([]);

  const [formData, setFormData] = useState({
    type: "Sales",
    items: [
      {
        id: Date.now().toString(),
        date: getTodayDate(),
        invoice: 0,
        pan: "",
        particulars: "",
        isImport: false,
        isCapitalPurchase: false,
        amount: 0,
        taxable: 0,
        nonTaxable: 0,
        vatPercent: 0,
        tax: 0,
        grandTotal: 0,
      },
    ] as TxItem[],
  });

  const currentFiscalYear = React.useMemo(
    () => getFiscalYearFromDate(formData.items[0]?.date || getTodayDate(), fiscalYears),
    [formData.items, fiscalYears],
  );

  const currentVatRate = currentFiscalYear?.vatAmount ?? 0;

  useEffect(() => {
    const storedFiscalYears = localStorage.getItem("fiscalYears");
    if (storedFiscalYears) {
      setFiscalYears(JSON.parse(storedFiscalYears));
    } else {
      const initialFiscalYears = [
        { id: "1", year: "2082/83", vatAmount: 13 },
        { id: "2", year: "2083/84", vatAmount: 13 },
      ];
      setFiscalYears(initialFiscalYears);
    }
  }, []);

  useEffect(() => {
    if (!txId && fiscalYears.length > 0) {
      setFormData((prev) => {
        if (
          prev.items.length === 1 &&
          prev.items[0].vatPercent === 0 &&
          prev.items[0].taxable === 0
        ) {
          const defaultVat = getFiscalYearFromDate(prev.items[0].date, fiscalYears)?.vatAmount ?? 0;
          if (defaultVat > 0) {
            const newItems = [...prev.items];
            newItems[0] = { ...newItems[0], vatPercent: defaultVat };
            return { ...prev, items: newItems };
          }
        }
        return prev;
      });
    }
  }, [fiscalYears, txId]);

  // FIXED: resolves the real client id from the actual response shape
  // ({ status: 'success', client: {...} }) and never falls back to the
  // slug string, which is not a valid UUID and was causing "invalid client
  // ID" errors on save.
  useEffect(() => {
    if (!slug || typeof slug !== "string") return;
    setClientResolving(true);
    (async () => {
      try {
        const res = await ApiGetClientBySlug(slug);
        const resolvedId = resolveClientIdFromResponse(res);

        if (resolvedId) {
          setClientId(resolvedId);
        } else {
          console.error(
            "[AddTransaction] Could not resolve client id from ApiGetClientBySlug response:",
            res?.data,
          );
          showNotify("error", "Failed to resolve client. Please go back and try again.");
        }
      } catch (error) {
        console.error("Error resolving client for transaction form", error);
        showNotify("error", "Failed to load client details. Please try again.");
      } finally {
        setClientResolving(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!txId || typeof txId !== "string") return;
    (async () => {
      try {
        const res = await ApiGetTransactionById(txId);
        const tx = extractTransaction(res);
        if (!tx) return;

        const loadedItem: TxItem = {
          id: Date.now().toString(),
          date: tx.transaction_date ? String(tx.transaction_date).split("T")[0] : getTodayDate(),
          invoice: toSafeInt(tx.invoice_no),
          debitInvoice: toSafeInt(tx.debit_invoice_no),
          creditInvoice: toSafeInt(tx.credit_invoice_no),
          pan: toSafePan(tx.pan_no),
          particulars: tx.party || "",
          isImport: Boolean(tx.import),
          isCapitalPurchase: Boolean(tx.capital),
          amount: Number(tx.amount) || 0,
          taxable: Number(tx.taxable) || 0,
          nonTaxable: Number(tx.non_taxable) || 0,
          vatPercent: Number(tx.vat) || 0,
          tax: Number(tx.vat_amount) || 0,
          grandTotal: Number(tx.grand_total) || 0,
        };

        setFormData({
          type: apiToUiType[tx.transaction_type] || "Sales",
          items: [loadedItem],
        });
      } catch (error) {
        console.error("Error loading transaction for edit", error);
        showNotify("error", "Failed to load transaction. Please try again.");
      }
    })();
  }, [txId]);

  useEffect(() => {
    if (!clientId) return;
    let targetCategory = "";
    if (formData.type === "Sales" || formData.type === "Purchase Return") {
      targetCategory = "PURCHASE";
    } else if (formData.type === "Sales Return") {
      targetCategory = "SALES";
    } else if (formData.type === "Purchase") {
      targetCategory = "PURCHASE";
    }

    (async () => {
      try {
        const res = await APIGetPartiesOrPan({ client_id: clientId, category: targetCategory });
        const raw = res?.data?.data ?? res?.data ?? [];
        const records = Array.isArray(raw)
          ? raw
              .map((p: any) => ({
                party: String(p?.party ?? p?.name ?? "").trim(),
                pan: toSafePan(p?.pan_no ?? p?.pan ?? ""),
              }))
              .filter((r: { party: string; pan: string }) => r.party)
          : [];

        const seen = new Map<string, string>();
        records.forEach((r: { party: string; pan: string }) => {
          if (!seen.has(r.party)) seen.set(r.party, r.pan);
        });
        const deduped = Array.from(seen.entries()).map(([party, pan]) => ({ party, pan }));

        setPartyPanRecords(deduped);
        setParticularSuggestions(deduped.map((r) => r.party));
      } catch (error) {
        console.error("Error fetching particulars suggestions", error);
        setPartyPanRecords([]);
        setParticularSuggestions([]);
        showNotify("error", "Failed to load party/PAN suggestions. You can still enter them manually.");
      }
    })();
  }, [clientId, formData.type]);

  const panToParty = React.useMemo(() => {
    const map = new Map<string, string>();
    partyPanRecords.forEach((r) => {
      if (r.pan && !map.has(r.pan)) map.set(r.pan, r.party);
    });
    return map;
  }, [partyPanRecords]);

  const partyToPan = React.useMemo(() => {
    const map = new Map<string, string>();
    partyPanRecords.forEach((r) => {
      if (r.party && r.pan && !map.has(r.party)) map.set(r.party, r.pan);
    });
    return map;
  }, [partyPanRecords]);

  const validateTxForm = (): boolean => {
    const errors: TxErrors = {};
    if (formData.items.length === 0) {
      errors.items = "At least one item is required.";
    } else {
      let hasError = false;
      let amountError = false;
      let panError = false;
      let invoiceError = false;
      const isReturn = formData.type === "Sales Return" || formData.type === "Purchase Return";

      for (const item of formData.items) {
        if (!item.date) hasError = true;

        // PAN must be exactly 9 digits — matches the backend's `gte`
        // validation on a valid PAN range. A shorter numeric string
        // (e.g. "45") used to pass a naive /^\d+$/ check but produced a
        // too-small number that the backend's `gte` tag rejects.
        if (!/^\d{9}$/.test(item.pan.trim())) {
          panError = true;
        }

        // Invoice numbers must be positive integers (never strings/floats/NaN).
        if (!isReturn) {
          if (!Number.isInteger(item.invoice) || item.invoice <= 0) {
            invoiceError = true;
          }
        } else {
          const hasDebit = Number.isInteger(item.debitInvoice) && (item.debitInvoice ?? 0) > 0;
          const hasCredit = Number.isInteger(item.creditInvoice) && (item.creditInvoice ?? 0) > 0;
          if (!hasDebit && !hasCredit) invoiceError = true;
        }

        if (!item.particulars.trim()) hasError = true;
        if (item.amount < 0 || item.taxable < 0 || item.nonTaxable < 0) hasError = true;
        if (item.amount !== item.taxable + item.nonTaxable) amountError = true;
      }

      if (panError) errors.pan = "PAN must be exactly 9 digits.";
      if (invoiceError) errors.invoice = "Invoice number must be a valid whole number.";
      if (hasError)
        errors.items = "All items must have date, invoice, PAN, particulars and valid amounts.";
      else if (amountError)
        errors.items = "Amount must be exactly the sum of Taxable and Non-Taxable amounts.";
    }

    setTxFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTxForm()) {
      showNotify("warning", "Please fix the highlighted errors before saving.");
      return;
    }
    if (!clientId) {
      showNotify("error", "Client not loaded yet. Please wait a moment and try again.");
      return;
    }

    setIsSaving(true);
    try {
      const payloads = formData.items.map((item) => itemToPayload(formData.type, item));

      if (txId && typeof txId === "string") {
        const [firstPayload, ...restPayloads] = payloads;
        const res = await ApiUpdateClientTransaction(clientId, txId, firstPayload);
        if (res?.data?.success === false) {
          throw new Error(extractErrorMessage(res, "Failed to update transaction."));
        }
        if (restPayloads.length > 0) {
          const createRes = await ApiCreateClientTransaction(clientId, restPayloads);
          if (createRes?.data?.success === false) {
            throw new Error(extractErrorMessage(createRes, "Failed to create additional transactions."));
          }
        }
        showNotify("success", "Transaction updated successfully.");
      } else {
        const res = await ApiCreateClientTransaction(clientId, payloads);
        if (res?.data?.success === false) {
          throw new Error(extractErrorMessage(res, "Failed to create transaction."));
        }
        showNotify("success", "Transaction created successfully.");
      }

      router.push(`/admin/clients/${slug}`);
    } catch (error: any) {
      console.error("Error saving transaction", error);
      showNotify("error", extractErrorMessage(error, `Failed to ${txId ? "update" : "create"} transaction. Please try again.`));
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemChange = (index: number, field: keyof TxItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };

    if (field === "amount" || field === "taxable" || field === "nonTaxable" || field === "vatPercent") {
      item[field] = Number(value) || 0;
    }

    // Invoice-type fields: always coerced to a clean non-negative integer.
    if (field === "invoice" || field === "debitInvoice" || field === "creditInvoice") {
      item[field] = toSafeInt(value);
    }

    // PAN: always a clean digit-only string (kept as string to preserve any leading zeros).
    if (field === "pan") {
      item.pan = toSafePan(value);
    }

    if (field === "date") {
      item.vatPercent = getFiscalYearFromDate(item.date, fiscalYears)?.vatAmount ?? currentVatRate;
    }

    if (field === "pan") {
      const matchedParty = panToParty.get(String(item.pan).trim());
      if (matchedParty) item.particulars = matchedParty;
    }

    if (field === "particulars") {
      const matchedPan = partyToPan.get(String(item.particulars).trim());
      if (matchedPan) item.pan = matchedPan;
    }

    const tax = item.taxable * (item.vatPercent / 100);
    item.tax = Number(tax.toFixed(2));
    item.grandTotal = Number((item.taxable + item.nonTaxable + tax).toFixed(2));

    newItems[index] = item;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          date: getTodayDate(),
          invoice: 0,
          pan: "",
          particulars: "",
          isImport: false,
          isCapitalPurchase: false,
          amount: 0,
          taxable: 0,
          nonTaxable: 0,
          vatPercent: currentVatRate,
          tax: 0,
          grandTotal: 0,
        },
      ],
    }));
  };

  const [removeRowIndex, setRemoveRowIndex] = useState<number | null>(null);
  const requestRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setRemoveRowIndex(index);
  };
  const cancelRemoveItemRow = () => setRemoveRowIndex(null);
  const confirmRemoveItemRow = () => {
    if (removeRowIndex === null) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== removeRowIndex),
    }));
    showNotify("success", "Row removed.");
    setRemoveRowIndex(null);
  };

  // Dynamically calculate explicit footer colSpan to prevent misalignments
  const isReturnMode = ["Sales Return", "Purchase Return"].includes(formData.type);
  const footerColSpan = (isReturnMode ? 10 : 9) + (formData.type === "Purchase" ? 1 : 0);

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <Box mb="xl">
        <CommonButton
          component={Link}
          href={`/admin/clients/${slug}`}
          variant="subtle"
          color="var(--muted-foreground)"
          leftSection={<ArrowLeft size={16} />}
          mb="md"
        >
          Back to Client Details
        </CommonButton>
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2}>
              {txId ? "Edit Transaction" : "Add Transaction"}
            </Title>
          </Box>
        </Group>
      </Box>

      <Paper withBorder radius="md" p="md"
      >
        <form onSubmit={handleSaveTransaction} noValidate>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="md">
            <Select
              required
              label="Transaction Type"
              data={["Sales", "Purchase", "Sales Return", "Purchase Return"]}
              value={formData.type}
              onChange={(val) => {
                const newType = val || "Sales";
                setFormData((prev) => ({ ...prev, type: newType }));
              }}
            />
          </SimpleGrid>

          <Box mb="xl" style={{ overflowX: "auto" }}>
            <Text fw={600} mb="xs">
              Line Items
            </Text>
            {txFormErrors.items && (
              <Text c="red" size="sm" mb="xs">
                {txFormErrors.items}
              </Text>
            )}
            {txFormErrors.pan && (
              <Text c="red" size="sm" mb="xs">
                {txFormErrors.pan}
              </Text>
            )}
            {txFormErrors.invoice && (
              <Text c="red" size="sm" mb="xs">
                {txFormErrors.invoice}
              </Text>
            )}
            {formData.items.some((item) => item.amount !== item.taxable + item.nonTaxable) && (
              <Text c="red" size="sm" mb="xs">
                Amount must be exactly the sum of Taxable and Non-Taxable amounts.
              </Text>
            )}

            <Table withTableBorder withColumnBorders style={{ tableLayout: "auto" }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ minWidth: 160 }}>Date (B.S.)</Table.Th>
                  {isReturnMode ? (
                    <>
                      <Table.Th style={{ minWidth: 140 }}>Debit Invoice</Table.Th>
                      <Table.Th style={{ minWidth: 140 }}>Credit Invoice</Table.Th>
                    </>
                  ) : (
                    <Table.Th style={{ minWidth: 140 }}>Invoice No.</Table.Th>
                  )}
                  <Table.Th style={{ minWidth: 120 }}>PAN/VAT</Table.Th>
                  <Table.Th style={{ minWidth: 180 }}>Party/Particulars</Table.Th>
                  {formData.type === "Purchase" && (
                    <Table.Th style={{ minWidth: 150 }}>Import / Capital</Table.Th>
                  )}
                  <Table.Th style={{ minWidth: 120 }}>Amount</Table.Th>
                  <Table.Th style={{ minWidth: 120 }}>Taxable</Table.Th>
                  <Table.Th style={{ minWidth: 120 }}>NonTaxable</Table.Th>
                  <Table.Th style={{ minWidth: 90 }}>VAT %</Table.Th>
                  <Table.Th style={{ minWidth: 110 }}>VAT Amount</Table.Th>
                  <Table.Th style={{ minWidth: 140 }}>Grand Total</Table.Th>
                  <Table.Th style={{ width: 50 }} />
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {formData.items.map((item, index) => (
                  <Table.Tr key={item.id}>
                   <Table.Td>
  <NepaliDatePicker
    value={item.date}
    onChange={(adDate) => handleItemChange(index, "date", adDate)}
    placeholder="Select date"
    calendarPosition="top"
  />
</Table.Td>
                    {isReturnMode ? (
                      <>
                        <Table.Td>
                          <TextInput
                            placeholder="Debit Invoice"
                            inputMode="numeric"
                            value={item.debitInvoice || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "debitInvoice",
                                e.currentTarget.value.replace(/\D/g, ""),
                              )
                            }
                            variant="unstyled"
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            placeholder="Credit Invoice"
                            inputMode="numeric"
                            value={item.creditInvoice || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "creditInvoice",
                                e.currentTarget.value.replace(/\D/g, ""),
                              )
                            }
                            variant="unstyled"
                          />
                        </Table.Td>
                      </>
                    ) : (
                      <Table.Td>
                        <TextInput
                          placeholder="Invoice"
                          inputMode="numeric"
                          value={item.invoice || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "invoice",
                              e.currentTarget.value.replace(/\D/g, ""),
                            )
                          }
                          variant="unstyled"
                        />
                      </Table.Td>
                    )}
                    <Table.Td>
                      <TextInput
                        placeholder="PAN"
                        inputMode="numeric"
                        maxLength={9}
                        value={item.pan}
                        onChange={(e) => handleItemChange(index, "pan", e.currentTarget.value.replace(/\D/g, ""))}
                        variant="unstyled"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Autocomplete
                        placeholder="Particulars"
                        data={particularSuggestions}
                        value={item.particulars}
                        onChange={(value) => handleItemChange(index, "particulars", value)}
                        variant="unstyled"
                      />
                    </Table.Td>
                    {formData.type === "Purchase" && (
                      <Table.Td>
                        <Group gap="xs" style={{ whiteSpace: "nowrap" }}>
                          <Checkbox
                            label="Import"
                            size="xs"
                            checked={item.isImport || false}
                            onChange={(e) => handleItemChange(index, "isImport", e.currentTarget.checked)}
                          />
                          <Checkbox
                            label="Capital Purchase"
                            size="xs"
                            checked={item.isCapitalPurchase || false}
                            onChange={(e) => handleItemChange(index, "isCapitalPurchase", e.currentTarget.checked)}
                          />
                        </Group>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <NumberInput
                        value={item.amount}
                        min={0}
                        onChange={(v) => handleItemChange(index, "amount", v)}
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.taxable}
                        min={0}
                        onChange={(v) => handleItemChange(index, "taxable", v)}
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.nonTaxable}
                        min={0}
                        onChange={(v) => handleItemChange(index, "nonTaxable", v)}
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.vatPercent}
                        suffix="%"
                        onChange={(v) => handleItemChange(index, "vatPercent", v)}
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.tax}
                        readOnly
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.grandTotal}
                        readOnly
                        variant="unstyled"
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => requestRemoveItemRow(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>

              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th colSpan={footerColSpan}>
                    <CommonButton
                      variant="subtle"
                      size="xs"
                      leftSection={<Plus size={14} />}
                      onClick={addItemRow}
                    >
                      Add Row
                    </CommonButton>
                  </Table.Th>
                  <Table.Th>
                    {formData.items
                      .reduce((s, i) => s + i.grandTotal, 0)
                      .toLocaleString()}
                  </Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </Box>

          <Group justify="flex-end">
            <CommonButton
              variant="default"
              onClick={() => router.push(`/admin/clients/${slug}`)}
            >
              Cancel
            </CommonButton>
            <CommonButton type="submit" loading={isSaving} disabled={clientResolving || !clientId}>
              Save Transaction
            </CommonButton>
          </Group>
        </form>
      </Paper>

      {removeRowIndex !== null && (
        <RemoveRowConfirm
          onCancel={cancelRemoveItemRow}
          onConfirm={confirmRemoveItemRow}
        />
      )}
    </DashboardLayout>
  );
}

function RemoveRowConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal opened onClose={onCancel} title="Remove Row" centered>
      <Text size="sm" mb="lg">
        Are you sure you want to remove this line item? This cannot be undone.
      </Text>
      <Group justify="flex-end">
        <CommonButton variant="default" onClick={onCancel}>
          Cancel
        </CommonButton>
        <CommonButton color="var(--destructive)" onClick={onConfirm}>
          Remove
        </CommonButton>
      </Group>
    </Modal>
  );
}