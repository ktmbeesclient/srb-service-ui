import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { UserRolesEnum } from "@/utils/enums/enum";
import { Text, Paper, Flex, Table, Box, Loader, Center } from "@mantine/core";
import {
  CommonBadge,
  CommonFilter,
  CommonHeading,
  CommonSearch,
  CommonTable,
  CommonPagination,
  CommonButton,
} from "@/components/common";
import { exportTransactionsToExcel } from "@/utils/helpers/excelExport";
import { FileSpreadsheet } from "lucide-react";
import { TextInput } from "@mantine/core";
import { APIGetTransactions } from "../../../apis/transaction";
import { exportTransactionsExcel } from "../../../apis/export-transaction";
import showNotify from "@/utils/notify";
import { types } from "util";

const TYPE_OPTIONS = [
  { label: "Sales", value: "SALES" },
  { label: "Purchase", value: "PURCHASE" },
  { label: "Sales Return", value: "SALES_RETURN" },
  { label: "Purchase Return", value: "PURCHASE_RETURN" },
];

const typeLabel = (type: string) => {
  const match = TYPE_OPTIONS.find((t) => t.value === type);
  return match ? match.label : type;
};

const getBadgeColor = (type: string) => {
  switch (type) {
    case "SALES":
      return "var(--chart-2)";
    case "PURCHASE":
      return "var(--primary)";
    case "SALES_RETURN":
      return "var(--destructive)";
    case "PURCHASE_RETURN":
      return "var(--chart-3)";
    default:
      return "var(--muted-foreground)";
  }
};

interface Transaction {
  transaction_id: string;
  client_id: string;
  transaction_type: string;
  transaction_date: string;
  invoice_no: number;
  pan_no: number;
  party: string;
  amount: number;
  taxable: number;
  non_taxable: number;
  vat: number;
  vat_amount: number;
  grand_total: number;
  client_name: string;
  created_at: string;
  import: boolean;
  capital: boolean;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [debouncedStartDate, setDebouncedStartDate] = useState("");
  const [debouncedEndDate, setDebouncedEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedStartDate(startDate), 400);
    return () => clearTimeout(handle);
  }, [startDate]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedEndDate(endDate), 400);
    return () => clearTimeout(handle);
  }, [endDate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, debouncedStartDate, debouncedEndDate]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await APIGetTransactions({
        page,
        page_size: itemsPerPage,
        search: debouncedSearch,
        category: typeFilter || undefined,
        start_date: debouncedStartDate || undefined,
        end_date: debouncedEndDate || undefined,
      });

      if (res?.data?.success) {
        setTransactions(res.data.transactions ?? []);
        setTotal(res.data.metadata?.Total ?? 0);
      } else {
        setError(res?.data?.message || "Failed to fetch transactions");
        setTransactions([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch transactions");
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, debouncedStartDate, debouncedEndDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  
const handleExportExcel = async () => {
  try {
    setIsExporting(true);

    await exportTransactionsExcel({
      page,
      pageSize: itemsPerPage,
      search: debouncedSearch || undefined,
      types: typeFilter ? [typeFilter] : undefined,
      startDate: debouncedStartDate || undefined,
      endDate: debouncedEndDate || undefined,
      year: "2026/27",
      vatPeriod: "Consolidated",
    });
  } catch (error: any) {
    console.error("Failed to export Excel:", error);
    alert(error?.message || "Failed to export Excel");
  } finally {
    setIsExporting(false);
  }
};

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <CommonHeading
        title="All Transactions"
        description="View transactions across all clients."
      />

      <Paper withBorder p="md" mb="lg" radius="md">
        <Flex
          gap="md"
          direction={{ base: "column", md: "row" }}
          align="flex-start"
        >
          <Box style={{ flex: 1, minWidth: 0, width: "100%" }}>
            <CommonSearch
              placeholder="Search by Client, Invoice, or Particular..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </Box>
          <Flex gap="md" style={{ flexWrap: "wrap" }}>
            <TextInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
              style={{ width: 180 }}
            />
            <TextInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
              style={{ width: 180 }}
            />
          </Flex>
        </Flex>
        <Flex gap="md" mt="md" align="center" justify="space-between">
          <CommonFilter
            value={typeFilter || ""}
            onChange={setTypeFilter}
            allLabel="All Types"
            options={TYPE_OPTIONS}
          />
          <CommonButton
            variant="light"
            color="var(--chart-2)"
            leftSection={<FileSpreadsheet size={16} />}
            onClick={handleExportExcel}
            loading={isExporting}
            disabled={transactions.length === 0}
          >
            Export Excel
          </CommonButton>
        </Flex>
      </Paper>

      <Paper withBorder radius="md">
        {loading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : error ? (
          <Center py="xl">
            <Text c="var(--destructive)">{error}</Text>
          </Center>
        ) : (
          <>
            <CommonTable
              headers={[
                "Client",
                "Date",
                "Type",
                "Invoice No",
                "Particulars",
                "Amount",
                "Taxable Amount",
                "Non Taxable Amount",
                "Tax",
                "Total",
              ]}
              isEmpty={transactions.length === 0}
              emptyMessage="No transactions found."
            >
              {transactions.map((t) => (
                <Table.Tr key={t.transaction_id}>
                  <Table.Td>
                    <Text fw={500}>{t.client_name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {new Date(t.transaction_date).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <CommonBadge color={getBadgeColor(t.transaction_type)}>
                      {typeLabel(t.transaction_type)}
                    </CommonBadge>
                  </Table.Td>
                  <Table.Td>{t.invoice_no}</Table.Td>
                  <Table.Td>{t.party}</Table.Td>
                  <Table.Td>{t.amount.toLocaleString()}</Table.Td>
                  <Table.Td>{t.taxable.toLocaleString()}</Table.Td>
                  <Table.Td>{t.non_taxable.toLocaleString()}</Table.Td>
                  <Table.Td>{t.vat_amount.toLocaleString()}</Table.Td>
                  <Table.Td>{t.grand_total.toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </CommonTable>
            {total > itemsPerPage && (
              <CommonPagination
                total={Math.ceil(total / itemsPerPage)}
                value={page}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Paper>
    </DashboardLayout>
  );
}