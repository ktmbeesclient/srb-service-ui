import React, { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { UserRolesEnum } from "@/utils/enums/enum";
import { Paper, Flex, Table, Group, Skeleton } from "@mantine/core";
import {
  CommonHeading,
  CommonSearch,
  CommonFilter,
  CommonTable,
  CommonBadge,
  CommonPagination,
  CommonButton,
} from "@/components/common";
import { Download } from "lucide-react";
import { ApiGetActiveTransaction } from "../../../apis/transaction";
import { exportTransactionsPDF } from "../../../apis/export-transaction";
import showNotify from "@/utils/notify";

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
  debit_invoice_no: number;
  credit_invoice_no: number;
  status: boolean;
  import: boolean;
  capital: boolean;
  created_at: string;
}

export default function ClientDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>();

  const [page, setPage] = useState(1);
  const itemsPerPage = 4;

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const res: any = await ApiGetActiveTransaction({
          page,
          page_size: itemsPerPage,
          search,
          category: typeFilter,
        });

        const payload = res?.data ?? res;

        setTransactions(payload.transactions || []);
        setTotalPages(
          Math.ceil(
            (payload.metadata?.Total || 0) /
              (payload.metadata?.PageSize || itemsPerPage),
          ),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, search, typeFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);

      // No page/pageSize — backend exports every row matching the
      // current search/type filters, not just what's on screen.
      // No clientId — the backend auth middleware pins CLIENT-role
      // exports to the caller's own client_id automatically.
      await exportTransactionsPDF({
        search: search || undefined,
        types: typeFilter ? [typeFilter] : undefined,
      });
    } catch (error: any) {
      console.error("Failed to export PDF:", error);
      showNotify(
        "error",
        error?.message || "Failed to export transactions. Please try again.",
      );
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <DashboardLayout role={UserRolesEnum.CLIENT}>
      <Group justify="space-between" align="flex-start" mb="md">
        <CommonHeading
          title="My Transactions"
          description="View and filter your transaction history."
        />
        <CommonButton
          variant="light"
          leftSection={<Download size={16} />}
          onClick={handleExportPDF}
          loading={isExportingPDF}
          disabled={transactions.length === 0}
        >
          Export PDF
        </CommonButton>
      </Group>

      <Paper withBorder shadow="sm" p="md" mb="xl" radius="md">
        <Flex
          gap="md"
          justify="space-between"
          direction={{ base: "column", md: "row" }}
        >
          <CommonSearch
            placeholder="Search by Invoice, Particulars, or PAN/VAT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CommonFilter
            value={typeFilter || ""}
            onChange={setTypeFilter}
            allLabel="All Types"
            options={[
              { label: "Sale", value: "SALES" },
              { label: "Purchase", value: "PURCHASE" },
              { label: "Sales Return", value: "SALES_RETURN" },
              { label: "Purchase Return", value: "PURCHASE_RETURN" },
            ]}
          />
        </Flex>
      </Paper>

      <Paper withBorder shadow="sm" radius="md">
        {loading ? (
          <div style={{ padding: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={32} mb="sm" radius="sm" />
            ))}
          </div>
        ) : (
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
            ]}
            isEmpty={transactions.length === 0}
            emptyMessage="No transactions found."
          >
            {transactions.map((tx) => (
              <Table.Tr key={tx.transaction_id}>
                <Table.Td>{tx.transaction_date?.split("T")[0]}</Table.Td>

                <Table.Td>
                  <CommonBadge
                    color={
                      tx.transaction_type === "SALES"
                        ? "var(--chart-2)"
                        : "var(--primary)"
                    }
                  >
                    {tx.transaction_type}
                  </CommonBadge>
                </Table.Td>

                <Table.Td>{tx.invoice_no}</Table.Td>
                <Table.Td>{tx.party}</Table.Td>
                <Table.Td>{tx.pan_no}</Table.Td>
                <Table.Td>{tx.amount.toLocaleString()}</Table.Td>
                <Table.Td>{tx.taxable.toLocaleString()}</Table.Td>
                <Table.Td>{tx.non_taxable.toLocaleString()}</Table.Td>
                <Table.Td>{tx.vat_amount.toLocaleString()}</Table.Td>
                <Table.Td>{tx.grand_total.toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
          </CommonTable>
        )}

        {totalPages > 1 && (
          <CommonPagination
            total={totalPages}
            value={page}
            onChange={setPage}
          />
        )}
      </Paper>
    </DashboardLayout>
  );
}