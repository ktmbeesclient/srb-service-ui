"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useRouter } from "next/router";
import {
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Tag,
  CornerDownLeft,
  CornerUpRight,
  Calculator,
  Landmark,
  Download,
  FileSpreadsheet,
} from "lucide-react";
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
  Tooltip,
  Modal,
  SimpleGrid,
  ActionIcon,
  PasswordInput,
  NumberInput,
  Box,
  Table,
} from "@mantine/core";
import {
  CommonTable,
  CommonBadge,
  CommonButton,
  CommonPagination,
} from "@/components/common";
import { ADToBS } from "bikram-sambat-js";
import {
  FiscalYear,
  getFiscalYearFromDate,
} from "@/utils/helpers/dateFormatter";
import { exportTableToPDF } from "@/utils/helpers/pdfExport";
import { exportTransactionsToExcel } from "@/utils/helpers/excelExport";
import { GetRequest } from "@/plugins/https";
import {
  ApiDeleteTransactionById,
  APIGetTransactions,
} from "../../../../../apis/transaction";
import {
  ApiGetClientBySlug,
  ApiUpdateClientById,
} from "../../../../../apis/client";
import { APIActiveFillingPeriod } from "../../../../../apis/filling-period";
import showNotify from "@/utils/notify";
import { exportTransactionsExcel, exportTransactionsPDF } from "../../../../../apis/export-transaction";
import NepaliDatePicker from "@/components/common/NepaliDatePIcker";

function generateRandomPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = required.length; i < 12; i++) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }
  return required.sort(() => Math.random() - 0.5).join("");
}

type ClientErrors = {
  name?: string;
  pan?: string;
  address?: string;
  password?: string;
  vatFilingPeriodId?: string;
};

type FilingPeriod = {
  id: string;
  name: string;
};

const normalizeFilingPeriods = (payload: any): FilingPeriod[] => {
  const rawPeriods = payload?.data?.data ?? payload?.data ?? payload;
  const periods = Array.isArray(rawPeriods)
    ? rawPeriods
    : rawPeriods
      ? [rawPeriods]
      : [];

  return periods
    .map((period: any) => ({
      id: String(
        period?.id ??
          period?._id ??
          period?.filing_period_id ??
          period?.filling_period_id ??
          "",
      ),
      name: String(period?.name ?? period?.period_name ?? ""),
    }))
    .filter((period: FilingPeriod) => period.id && period.name);
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function ClientDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [filingPeriods, setFilingPeriods] = useState<FilingPeriod[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [clientData, setClientData] = useState({
    id: "",
    name: "",
    slug: "",
    pan: "",
    address: "",
    password: "",
    vatFilingPeriodId: "",
    vatFilingPeriodName: "",
  });

  // --- Delete confirmation modal state ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClient = async () => {
    const slug = router.query.slug as string;

    if (!slug) return;

    const res = await ApiGetClientBySlug(slug);

    if (res?.data?.success) {
      const client = res.data.data;
      const vatPeriodId = String(
        client.vat_filing_period_id ??
          client.period_id ??
          client.filing_period_id ??
          "",
      );
      const vatPeriodName = String(
        client.period_name ??
          client.vat_filing_period_name ??
          client.filing_period_name ??
          "",
      );

      setClientData({
        id: client.id,
        name: client.name,
        slug: client.slug,
        pan: String(client.pan_no),
        address: client.address,
        password: "",
        vatFilingPeriodId: vatPeriodId,
        vatFilingPeriodName: vatPeriodName,
      });
    }
  };
  const fetchFilingPeriod = async () => {
    try {
      const res = await APIActiveFillingPeriod();
      setFilingPeriods(normalizeFilingPeriods(res));
    } catch (error) {
      console.error("Error fetching filing periods:", error);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchClient();
      fetchFilingPeriod();
    }
  }, [slug, page]);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    if (
      !clientData.vatFilingPeriodId &&
      clientData.vatFilingPeriodName &&
      filingPeriods.length > 0
    ) {
      const matchedPeriod = filingPeriods.find(
        (period) => period.name === clientData.vatFilingPeriodName,
      );

      if (matchedPeriod) {
        setClientData((prev) => ({
          ...prev,
          vatFilingPeriodId: matchedPeriod.id,
          vatFilingPeriodName: matchedPeriod.name,
        }));
      }
    }
  }, [
    clientData.vatFilingPeriodId,
    clientData.vatFilingPeriodName,
    filingPeriods,
  ]);

  useEffect(() => {
    if (clientData.id) {
      fetchTransactions();
    }
  }, [clientData.id, page, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalCount]);

  const mapTransactionType = (type: string) => {
    switch (type) {
      case "SALES":
        return "Sales";
      case "PURCHASE":
        return "Purchase";
      case "SALES_RETURN":
        return "Sales Return";
      case "PURCHASE_RETURN":
        return "Purchase Return";
      default:
        return type;
    }
  };

  const fetchTransactions = async () => {
    if (!slug || !clientData.id) return;
    setLoading(true);
    try {
      const res = await APIGetTransactions({
        page: page,
        page_size: itemsPerPage,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        client_id: clientData.id,
      });

      if (res && res?.data?.success && res.data.transactions) {
        const mappedData = res.data.transactions.map((tx: any) => ({
          id: tx.transaction_id,
          type: mapTransactionType(tx.transaction_type),
          date: tx.transaction_date ? tx.transaction_date.split("T")[0] : "",
          invoice:
            tx.invoice_no && tx.invoice_no !== 0
              ? tx.invoice_no.toString()
              : "-",
          particulars: tx.party || "-",
          pan: tx.pan_no && tx.pan_no !== 0 ? tx.pan_no.toString() : "-",
          amount: tx.amount || 0,
          taxable: tx.taxable,
          nonTaxable: tx.non_taxable,
          tax: tx.vat_amount || 0,
          debitInvoice:
            tx.debit_invoice_no && tx.debit_invoice_no !== 0
              ? tx.debit_invoice_no.toString()
              : "",
          creditInvoice:
            tx.credit_invoice_no && tx.credit_invoice_no !== 0
              ? tx.credit_invoice_no.toString()
              : "",
          items: [],
        }));
        setTransactions(mappedData);
        setTotalCount(res.data.metadata?.Total ?? mappedData.length);
      } else {
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (e) {
      console.error("Error fetching transactions from API", e);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const [isEditClientOpen, setIsEditClientOpen] = useState(false);

  const [clientFormErrors, setClientFormErrors] = useState<ClientErrors>({});

  const validateClientForm = (): boolean => {
    const errors: ClientErrors = {};
    if (!clientData.name.trim() || clientData.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters.";
    if (!clientData.pan.trim() || !/^\d{9}$/.test(clientData.pan.trim()))
      errors.pan = "PAN must be exactly 9 digits.";
    if (!clientData.address.trim()) errors.address = "Address is required.";
    if (clientData.password && clientData.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (!clientData.vatFilingPeriodId)
      errors.vatFilingPeriodId = "VAT filing period is required.";
    setClientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClientForm()) return;

    try {
      const payload: Record<string, any> = {
        name: clientData.name.trim(),
        pan_no: Number(clientData.pan),
        address: clientData.address.trim(),
        period_id: clientData.vatFilingPeriodId,
        password: clientData.password,
      };

      if (clientData.password) {
        payload.password = clientData.password;
      }

      const res = await ApiUpdateClientById(clientData.id, payload);

      if (res?.data?.success === false) {
        throw new Error(res?.data?.message || "Failed to update client.");
      }

      showNotify("success", "Client updated successfully.");
      setIsEditClientOpen(false);
      fetchClient();
    } catch (error) {
      console.error("Error updating client", error);
      showNotify("error", "Failed to update client. Please try again.");
    }
  };

  const clientField = <K extends keyof typeof clientData>(
    key: K,
    value: (typeof clientData)[K],
  ) => {
    setClientData((prev) => ({ ...prev, [key]: value }));
    setClientFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // --- Delete flow: open modal instead of native confirm() ---
  const handleDelete = (txId: string) => {
    if (!clientData.id) {
      console.error("Client id not loaded yet — cannot delete transaction.");
      return;
    }
    setDeleteTxId(txId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeleteTxId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTxId || !clientData.id) return;
    setDeleting(true);
    try {
      await ApiDeleteTransactionById(clientData.id, deleteTxId);
      showNotify("success", "Transaction deleted successfully.");
      setPage(1); // triggers useEffect to fetch page 1
    } catch (e) {
      console.error("Error deleting transaction via API", e);
      showNotify("error", "Failed to delete transaction. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setDeleteTxId(null);
    }
  };
const handleExportExcel = async () => {
  try {
    setIsExporting(true);

    await exportTransactionsExcel({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      clientId: clientData.id,
      vatPeriod:
        filingPeriods.find((p) => p.id === clientData.vatFilingPeriodId)
          ?.name ?? clientData.vatFilingPeriodName,
    });
  } catch (error: any) {
    console.error("Failed to export Excel:", error);
    showNotify(
      "error",
      error?.message || "Failed to export transactions. Please try again."
    );
  } finally {
    setIsExporting(false);
  }
};

// Add this handler inside your React component where your export buttons live
const handleExportPDF = async () => {
  try {
    setIsExportingPDF(true);

    await exportTransactionsPDF({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      clientId: clientData.id,
      vatPeriod:
        filingPeriods.find((p) => p.id === clientData.vatFilingPeriodId)
          ?.name ?? clientData.vatFilingPeriodName,
    });
  } catch (error: any) {
    console.error("Failed to export PDF:", error);
    showNotify(
      "error",
      error?.message || "Failed to export transactions. Please try again."
    );
  } finally {
    setIsExportingPDF(false);
  }
};
  const totalSales = transactions
    .filter((t) => t.type === "Sales")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalPurchase = transactions
    .filter((t) => t.type === "Purchase")
    .reduce((acc, t) => acc + t.amount, 0);
  const salesReturn = transactions
    .filter((t) => t.type === "Sales Return")
    .reduce((acc, t) => acc + t.amount, 0);
  const purchaseReturn = transactions
    .filter((t) => t.type === "Purchase Return")
    .reduce((acc, t) => acc + t.amount, 0);

  const netTaxable =
    totalSales - salesReturn - (totalPurchase - purchaseReturn);

  const salesTax = transactions
    .filter((t) => t.type === "Sales")
    .reduce((acc, t) => acc + t.tax, 0);
  const purchaseTax = transactions
    .filter((t) => t.type === "Purchase")
    .reduce((acc, t) => acc + t.tax, 0);
  const salesReturnTax = transactions
    .filter((t) => t.type === "Sales Return")
    .reduce((acc, t) => acc + t.tax, 0);
  const purchaseReturnTax = transactions
    .filter((t) => t.type === "Purchase Return")
    .reduce((acc, t) => acc + t.tax, 0);

  const netVat = salesTax - salesReturnTax - (purchaseTax - purchaseReturnTax);

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <Box mb="xl">
        <CommonButton
          component={Link}
          href="/admin/clients"
          variant="subtle"
          color="var(--muted-foreground)"
          leftSection={<ArrowLeft size={16} />}
          mb="md"
        >
          Back to Clients
        </CommonButton>
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2}>{clientData.name}</Title>
            <Group gap="xs" mt={4}>
              <CommonBadge color="var(--primary)">
                PAN: {clientData.pan}
              </CommonBadge>
              <Text size="sm" c="var(--muted-foreground)">
                •
              </Text>
              <Text size="sm" c="var(--muted-foreground)">
                {clientData.address}
              </Text>
              <Text size="sm" c="var(--muted-foreground)">
                •
              </Text>
              <Text size="sm" c="var(--muted-foreground)">
                VAT:{" "}
                {filingPeriods.find(
                  (p) => p.id === clientData.vatFilingPeriodId,
                )?.name ||
                  clientData.vatFilingPeriodName ||
                  "-"}
              </Text>
            </Group>
          </Box>
          <Group>
            <CommonButton
              variant="default"
              leftSection={<Edit size={16} />}
              onClick={() => {
                setClientFormErrors({});
                setIsEditClientOpen(true);
              }}
            >
              Edit Client
            </CommonButton>
            <CommonButton
              component={Link}
              href={`/admin/clients/${slug}/add-transaction`}
              leftSection={<Plus size={16} />}
            >
              Add Transaction
            </CommonButton>
          </Group>
        </Group>
      </Box>

      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Total Purchase
            </Text>
            <ShoppingCart size={16} color="var(--muted-foreground)" />
          </Group>
          <Text size="xl" fw={700}>
            {totalPurchase.toLocaleString()}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Total Sales
            </Text>
            <Tag size={16} color="var(--muted-foreground)" />
          </Group>
          <Text size="xl" fw={700}>
            {totalSales.toLocaleString()}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Purchase Return
            </Text>
            <CornerDownLeft size={16} color="var(--muted-foreground)" />
          </Group>
          <Text size="xl" fw={700}>
            {purchaseReturn.toLocaleString()}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Sales Return
            </Text>
            <CornerUpRight size={16} color="var(--muted-foreground)" />
          </Group>
          <Text size="xl" fw={700}>
            {salesReturn.toLocaleString()}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Net Taxables
            </Text>
            <Calculator
              size={16}
              color={netTaxable >= 0 ? "var(--chart-1)" : "var(--destructive)"}
            />
          </Group>
          <Text
            size="xl"
            fw={700}
            c={netTaxable >= 0 ? "var(--chart-1)" : "var(--destructive)"}
          >
            {netTaxable.toLocaleString()}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" c="var(--muted-foreground)" fw={500} tt="uppercase">
              Net VAT
            </Text>
            <Landmark
              size={16}
              color={netVat >= 0 ? "var(--chart-1)" : "var(--destructive)"}
            />
          </Group>
          <Text
            size="xl"
            fw={700}
            c={netVat >= 0 ? "var(--chart-1)" : "var(--destructive)"}
          >
            {netVat.toLocaleString()}
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md">
        <Box
          p="md"
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
          }}
        >
          <Group justify="space-between" mb="sm">
            <Title order={3} size="h4">
              Transactions
            </Title>
            <Group gap="md">
      <NepaliDatePicker placeholder="Start Date" value={startDate} onChange={setStartDate} />
      <NepaliDatePicker placeholder="End Date" value={endDate} onChange={setEndDate} />
              <CommonButton
                size="xs"
                variant="light"
                color="var(--chart-2)"
                leftSection={<FileSpreadsheet size={14} />}
                onClick={handleExportExcel}
                disabled={false}
              >
                Export Excel
              </CommonButton>
              <CommonButton
                size="xs"
                variant="light"
                leftSection={<Download size={14} />}
                onClick={handleExportPDF}
              >
                Export PDF
              </CommonButton>
            </Group>
          </Group>
        </Box>
        <CommonTable
          headers={[
            "Date",
            "Type",
            "Invoice No.",
            "Particulars",
            "PAN/VAT",
            "Amount",
            "Taxable Amount",
            "Non Taxable Amount",
            "Tax",
            "Total",
            "Actions",
          ]}
          isEmpty={transactions.length === 0}
          emptyMessage="No transactions found."
        >
          {transactions.map((tx) => (
            <Table.Tr key={tx.id}>
              <Table.Td>{tx.date}</Table.Td>
              <Table.Td>
                <CommonBadge
                  color={
                    tx.type.includes("Sales")
                      ? "var(--chart-2)"
                      : "var(--primary)"
                  }
                >
                  {tx.type}
                </CommonBadge>
              </Table.Td>
              <Table.Td>
                {tx.items && tx.items.length > 0
                  ? tx.items.map((item: any) => (
                      <div key={item.id}>
                        {tx.type.includes("Return")
                          ? [
                              item.debitInvoice
                                ? `Dr: ${item.debitInvoice}`
                                : "",
                              item.creditInvoice
                                ? `Cr: ${item.creditInvoice}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" | ") || "-"
                          : item.invoice || "-"}
                      </div>
                    ))
                  : tx.type.includes("Return")
                    ? [
                        tx.debitInvoice ? `Dr: ${tx.debitInvoice}` : "",
                        tx.creditInvoice ? `Cr: ${tx.creditInvoice}` : "",
                      ]
                        .filter(Boolean)
                        .join(" | ") || "-"
                    : tx.invoice || "-"}
              </Table.Td>
              <Table.Td>
                {tx.items && tx.items.length > 0
                  ? tx.items.map((item: any) => (
                      <div key={item.id}>{item.particulars || "-"}</div>
                    ))
                  : tx.particulars}
              </Table.Td>
              <Table.Td>
                {tx.items && tx.items.length > 0
                  ? tx.items.map((item: any) => (
                      <div key={item.id}>{item.pan || "-"}</div>
                    ))
                  : tx.pan}
              </Table.Td>
              <Table.Td>{tx.amount.toLocaleString()}</Table.Td>
              <Table.Td>{(tx.taxable ?? tx.amount).toLocaleString()}</Table.Td>
              <Table.Td>{(tx.nonTaxable ?? 0).toLocaleString()}</Table.Td>
              <Table.Td>{tx.tax.toLocaleString()}</Table.Td>
              <Table.Td>{(tx.amount + tx.tax).toLocaleString()}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    component={Link}
                    href={`/admin/clients/${slug}/add-transaction?txId=${tx.id}`}
                    variant="light"
                    color="var(--chart-3)"
                  >
                    <Edit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="var(--destructive)"
                    onClick={() => handleDelete(tx.id)}
                  >
                    <Trash2 size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </CommonTable>
        {totalCount > itemsPerPage && (
          <CommonPagination
            total={Math.max(1, Math.ceil(totalCount / itemsPerPage))}
            value={page}
            onChange={setPage}
          />
        )}
      </Paper>

      {/* Edit Client Modal */}
      <Modal
        opened={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        title="Edit Client"
      >
        <form onSubmit={handleSaveClient} noValidate>
          <TextInput
            required
            label="Name"
            mb="sm"
            value={clientData.name}
            error={clientFormErrors.name}
            onChange={(e) => clientField("name", e.currentTarget.value)}
          />
          <TextInput
            required
            label="PAN Number"
            mb="sm"
            maxLength={9}
            value={clientData.pan}
            error={clientFormErrors.pan}
            onChange={(e) =>
              clientField("pan", e.currentTarget.value.replace(/\D/g, ""))
            }
          />
          <TextInput
            required
            label="Address"
            mb="sm"
            value={clientData.address}
            error={clientFormErrors.address}
            onChange={(e) => clientField("address", e.currentTarget.value)}
          />

          <Group align="flex-start" mb="sm" gap="xs" wrap="nowrap">
            <PasswordInput
              label="Password (Leave blank to keep current)"
              placeholder="Min. 8 characters"
              style={{ flex: 1 }}
              value={clientData.password}
              error={clientFormErrors.password}
              onChange={(e) => clientField("password", e.currentTarget.value)}
            />
            <Tooltip
              label="Generate 12-character random password"
              position="top"
            >
              <ActionIcon
                variant="light"
                color="var(--primary)"
                size={36}
                mt={25}
                onClick={() => {
                  clientField("password", generateRandomPassword());
                }}
              >
                <RefreshCw size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Select
            label="VAT Filing Period"
            mb="md"
            placeholder="Select Filing Period"
            data={filingPeriods.map((period) => ({
              value: period.id,
              label: period.name,
            }))}
            value={clientData.vatFilingPeriodId}
            error={clientFormErrors.vatFilingPeriodId}
            onChange={(value) =>
              setClientData((prev) => ({
                ...prev,
                vatFilingPeriodId: value || "",
              }))
            }
          />
          <Group justify="flex-end">
            <CommonButton
              variant="default"
              onClick={() => setIsEditClientOpen(false)}
            >
              Cancel
            </CommonButton>
            <CommonButton type="submit">Save</CommonButton>
          </Group>
        </form>
      </Modal>

      {/* Delete Transaction Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Transaction"
        centered
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this transaction? This action
          cannot be undone.
        </Text>
        <Group justify="flex-end">
          <CommonButton
            variant="default"
            onClick={closeDeleteModal}
            disabled={deleting}
          >
            Cancel
          </CommonButton>
          <CommonButton
            color="var(--destructive)"
            onClick={confirmDelete}
            loading={deleting}
          >
            Delete
          </CommonButton>
        </Group>
      </Modal>
    </DashboardLayout>
  );
}