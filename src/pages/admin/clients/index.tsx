"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  RotateCcw,
  Users,
  CalendarDays,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { UserRolesEnum } from "@/utils/enums/enum";
import {
  Group,
  Text,
  Paper,
  TextInput,
  Select,
  Tooltip,
  Modal,
  SimpleGrid,
  ActionIcon,
  PasswordInput,
  Flex,
  Table,
  LoadingOverlay,
  Badge,
  Skeleton,
  Box,
} from "@mantine/core";
import {
  CommonHeading,
  CommonSearch,
  CommonFilter,
  CommonTable,
  CommonButton,
  CommonPagination,
} from "@/components/common";
import { APIActiveFillingPeriod } from "../../../../apis/filling-period";
import {
  ApiCreateClient,
  ApiDeleteClientById,
  ApiGetAllclient,
  ApiUpdateClientById,
} from "../../../../apis/client";
import {
  extractErrorMessage,
  notifyError,
  notifySuccess,
  throwIfApiError,
} from "@/components/common/Notification";
import { useRouter } from "next/navigation";

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
};

type ClientRow = {
  id: string;
  name: string;
  pan: string;
  address: string;
  vatPeriod: string;
  slug?: string;
  isActive: boolean;
};

type FilingPeriod = { id: string; name: string };

// ---- Skeleton helpers, scoped to this page's exact table/card shape ----
const STAT_CARD_COUNT = 4;
const TABLE_COLS = 6;
const SKELETON_ROW_COUNT = 5;

function StatCardSkeleton() {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="center" mb="xs">
        <Skeleton height={12} width="60%" radius="sm" />
        <Skeleton height={18} width={18} radius="sm" circle />
      </Group>
      <Skeleton height={24} width="40%" radius="sm" />
    </Paper>
  );
}

function ClientTableRowSkeleton() {
  return (
    <Table.Tr>
      {Array.from({ length: TABLE_COLS }).map((_, i) => (
        <Table.Td key={i}>
          <Skeleton height={14} width={i === TABLE_COLS - 1 ? 90 : "70%"} radius="sm" />
        </Table.Td>
      ))}
    </Table.Tr>
  );
}

export default function AdminClients() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [vatFilter, setVatFilter] = useState<string | null>("");
  const [statusFilter, setStatusFilter] = useState<string | null>("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pan: "",
    address: "",
    password: "",
    vatPeriod: "",
  });
  const [formErrors, setFormErrors] = useState<ClientErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filingPeriods, setFilingPeriods] = useState<FilingPeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, vatFilter, statusFilter]);

  useEffect(() => {
    const fetchPeriods = async () => {
      setIsLoadingPeriods(true);
      try {
        const res: any = await APIActiveFillingPeriod();
        const body = res?.data ?? res;
        const periods = body?.data ?? [];
        const mapped: FilingPeriod[] = periods.map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setFilingPeriods(mapped);
        setFormData((prev) =>
          prev.vatPeriod ? prev : { ...prev, vatPeriod: mapped[0]?.name ?? "" },
        );
      } catch (e) {
        console.error("Error fetching filing periods", e);
        notifyError(extractErrorMessage(e, "Failed to load filing periods."));
        setFilingPeriods([]);
      } finally {
        setIsLoadingPeriods(false);
      }
    };
    fetchPeriods();
  }, []);

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res: any = await ApiGetAllclient({
        page,
        pageSize: itemsPerPage,
        search: debouncedSearch || undefined,
        period_name: vatFilter || undefined,
      });
      const body = res?.data ?? res;
      console.log("Fetched clients:", body);
      const list = body?.clients ?? [];

      setClients(
        list.map((c: any) => {
          let activeVal = true;
          if (typeof c.status === "boolean") {
            activeVal = c.status;
          } else if (c.IsActive !== undefined) {
            activeVal = String(c.IsActive).toLowerCase() !== "inactive";
          } else if (c.isActive !== undefined) {
            activeVal = !!c.isActive;
          }

          return {
            id: c.id,
            name: c.name,
            pan:
              c.pan_no !== undefined && c.pan_no !== null
                ? String(c.pan_no)
                : "",
            address: c.address,
            vatPeriod: c.period_name,
            slug: c.slug,
            isActive: activeVal,
          };
        }),
      );
      const totalCount =
        body?.metadata?.Total ??
        body?.metadata?.total ??
        body?.metadata?.count ??
        list.length;

      setTotal(Number(totalCount) || list.length);
    } catch (e) {
      console.error("Error fetching clients", e);
      const msg = extractErrorMessage(e, "Failed to load clients.");
      setLoadError(msg);
      notifyError(msg);
      setClients([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, vatFilter, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const validateClientForm = (): boolean => {
    const errors: ClientErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2)
      errors.name = "Name must be at least 2 characters.";
    if (!formData.pan.trim() || !/^\d{9}$/.test(formData.pan.trim()))
      errors.pan = "PAN must be exactly 9 digits.";
    if (!formData.address.trim() || formData.address.trim().length < 3)
      errors.address = "Address must be at least 3 characters.";
    if (!editingClientId && formData.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClientForm()) return;

    const period = filingPeriods.find((p) => p.name === formData.vatPeriod);

    setIsSaving(true);
    try {
      if (editingClientId) {
        const payload: Record<string, any> = {
          name: formData.name.trim(),
          pan_no: Number(formData.pan),
          address: formData.address.trim(),
          period_id: period?.id,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        const res = await ApiUpdateClientById(editingClientId, payload);
        throwIfApiError(res);
        notifySuccess("Client updated successfully.");
      } else {
        const res = await ApiCreateClient({
          name: formData.name.trim(),
          pan_no: Number(formData.pan),
          address: formData.address.trim(),
          password: formData.password,
          period_id: period?.id,
        });
        throwIfApiError(res);
        notifySuccess("Client created successfully.");
      }
      closeModal();
      setEditingClientId(null);
      setFormData({
        name: "",
        pan: "",
        address: "",
        password: "",
        vatPeriod: filingPeriods[0]?.name ?? "",
      });
      fetchClients();
    } catch (e) {
      console.error("Error saving client", e);
      notifyError(
        extractErrorMessage(e, "Failed to save client. Please try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClient = (client: ClientRow) => {
    setEditingClientId(client.id);
    setFormData({
      name: client.name,
      pan: client.pan,
      address: client.address,
      password: "",
      vatPeriod: client.vatPeriod,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };
  const handleDeactivate = async (client: ClientRow) => {
    const previousIsActive = client.isActive;

    setDeletingId(client.id);
    setClientActiveStatus(client.id, false);

    try {
      const res = await ApiDeleteClientById(client.id);
      throwIfApiError(res);

      applyStatusFromResponse(client.id, res, false);

      notifySuccess("Client deactivated successfully.");
    } catch (e) {
      setClientActiveStatus(client.id, previousIsActive);
      console.error("Error deactivating client", e);
      notifyError(extractErrorMessage(e, "Failed to deactivate client."));
    } finally {
      setDeletingId(null);
      fetchClients();
    }
  };

  const setClientActiveStatus = (id: string, isActive: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive } : c)),
    );
  };

  const applyStatusFromResponse = (
    id: string,
    res: any,
    fallbackIsActive: boolean,
  ) => {
    const body = res?.data ?? res;
    const nowActive =
      body?.is_active !== undefined ? !!body.is_active : fallbackIsActive;
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: nowActive } : c)),
    );
    return nowActive;
  };

  const handleReactivate = async (client: ClientRow) => {
    const previousIsActive = client.isActive;
    setDeletingId(client.id);
    setClientActiveStatus(client.id, true);
    try {
      const res = await ApiDeleteClientById(client.id);
      throwIfApiError(res);
      const nowActive = applyStatusFromResponse(
        client.id,
        res,
        !previousIsActive,
      );
      notifySuccess(
        nowActive
          ? "Client reactivated successfully."
          : "Client deactivated successfully.",
      );
    } catch (e) {
      setClientActiveStatus(client.id, previousIsActive);
      console.error("Error reactivating client", e);
      notifyError(extractErrorMessage(e, "Failed to reactivate client."));
    } finally {
      setDeletingId(null);
      fetchClients();
    }
  };

  const field = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (!mounted) {
    return null;
  }
  console.log(
    "slug",
    clients.map((c) => c.slug),
  );
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  // True only on the very first fetch (no data yet) — shows skeleton instead
  // of an empty table. Subsequent refetches (page/search/filter change) keep
  // existing rows visible under the LoadingOverlay so nothing flashes blank.
  const isInitialLoading = isLoading && clients.length === 0 && !loadError;

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <Group justify="space-between" mb="lg">
        <CommonHeading title="Clients" />
        <CommonButton
          leftSection={<Plus size={16} />}
          onClick={() => {
            setEditingClientId(null);
            setFormData({
              name: "",
              pan: "",
              address: "",
              password: "",
              vatPeriod: filingPeriods[0]?.name ?? "",
            });
            setFormErrors({});
            setIsModalOpen(true);
          }}
        >
          Add Client
        </CommonButton>
      </Group>

      {/* <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
        {isInitialLoading ? (
          Array.from({ length: STAT_CARD_COUNT }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : (
          <>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" c="var(--muted-foreground)" fw={500}>
                  Total Clients
                </Text>
                <Users size={18} color="var(--muted-foreground)" />
              </Group>
              <Text size="xl" fw={700}>
                {total}
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" c="var(--muted-foreground)" fw={500}>
                  Monthly Filings
                </Text>
                <CalendarDays size={18} color="var(--muted-foreground)" />
              </Group>
              <Text size="xl" fw={700}>
                {clients.filter((c) => c.vatPeriod === "Monthly").length}
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" c="var(--muted-foreground)" fw={500}>
                  Trimester Filings
                </Text>
                <CalendarRange size={18} color="var(--muted-foreground)" />
              </Group>
              <Text size="xl" fw={700}>
                {clients.filter((c) => c.vatPeriod === "Trimester").length}
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" c="var(--muted-foreground)" fw={500}>
                  Pending This Month
                </Text>
                <AlertCircle size={18} color="var(--chart-3)" />
              </Group>
              <Text size="xl" fw={700} c="orange">
                12
              </Text>
            </Paper>
          </>
        )}
      </SimpleGrid> */}
{/* 
      <Paper withBorder p="md" mb="lg" radius="md">
        <Flex
          gap="md"
          justify="space-between"
          direction={{ base: "column", md: "row" }}

        >
         <Box className="w-full md:flex-1">
    <CommonSearch
      placeholder="Search by Name, PAN, or Address..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </Box>
          <CommonFilter
            value={vatFilter || ""}
            onChange={setVatFilter}
            allLabel="All VAT Periods"
            options={filingPeriods.map((p) => ({
              label: p.name,
              value: p.name,
            }))}
          />
        </Flex>
      </Paper> */}

      <Paper withBorder radius="md" pos="relative">
        {/* Overlay only for background refetches once we already have rows,
            so existing data stays visible instead of flashing to a skeleton. */}
        <LoadingOverlay visible={isLoading && clients.length > 0} />
        {loadError && (
          <Text size="sm" c="var(--destructive)" p="md">
            {loadError}
          </Text>
        )}
        <CommonTable
          headers={[
            "Name",
            "PAN Number",
            "Address",
            "VAT Period",
            "Status",
            "Actions",
          ]}
          isEmpty={!isLoading && !isInitialLoading && clients.length === 0}
          emptyMessage="No clients found."
        >
          {isInitialLoading
            ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <ClientTableRowSkeleton key={i} />
              ))
            : clients.map((client) => (
                <Table.Tr key={client.id}>
                  <Table.Td>
                    <Text fw={500}>{client.name}</Text>
                  </Table.Td>
                  <Table.Td>{client.pan}</Table.Td>
                  <Table.Td>{client.address}</Table.Td>
                  <Table.Td>{client.vatPeriod}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        client.isActive
                          ? "var(--chart-1)"
                          : "var(--muted-foreground)"
                      }
                      variant="light"
                    >
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Eye
                        size={16}
                        onClick={() =>
                          router.push(`/admin/clients/${client?.slug}`)
                        }
                      />
                      <ActionIcon
                        variant="light"
                        color="var(--chart-3)"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit size={16} />
                      </ActionIcon>
                      {client.isActive ? (
                        <Tooltip label="Deactivate client">
                          <ActionIcon
                            variant="light"
                            color="var(--destructive)"
                            loading={deletingId === client.id}
                            onClick={() => handleDeactivate(client)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Reactivate client">
                          <ActionIcon
                            variant="light"
                            color="var(--chart-1)"
                            loading={deletingId === client.id}
                            onClick={() => handleReactivate(client)}
                          >
                            <RotateCcw size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
        </CommonTable>
        {total > itemsPerPage && (
          <CommonPagination
            total={totalPages}
            value={page}
            onChange={setPage}
          />
        )}
      </Paper>

      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        title={editingClientId ? "Edit Client" : "Add Client"}
      >
        <form onSubmit={handleSaveClient} noValidate>
          <TextInput
            required
            label="Name"
            mb="sm"
            placeholder="e.g. Acme Corp"
            value={formData.name}
            error={formErrors.name}
            onChange={(e) => field("name", e.currentTarget.value)}
          />
          <TextInput
            required
            label="PAN Number"
            mb="sm"
            placeholder="9-digit PAN (e.g. 123456789)"
            maxLength={9}
            value={formData.pan}
            error={formErrors.pan}
            onChange={(e) =>
              field("pan", e.currentTarget.value.replace(/\D/g, ""))
            }
          />
          <TextInput
            required
            label="Address"
            mb="sm"
            placeholder="e.g. Kathmandu"
            value={formData.address}
            error={formErrors.address}
            onChange={(e) => field("address", e.currentTarget.value)}
          />

         <Group align="flex-start" mb="sm" gap="xs" wrap="nowrap">
  <PasswordInput
    required={!editingClientId}
    label={`Password${editingClientId ? " (leave blank to keep current)" : ""}`}
    placeholder="Min. 8 characters, no spaces"
    style={{ flex: 1 }}
    value={formData.password}
    error={formErrors.password}
    onKeyDown={(e) => {
      if (e.key === " ") {
        e.preventDefault();
      }
    }}
    onPaste={(e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\s/g, "");
      field("password", text);
    }}
    onChange={(e) =>
      field("password", e.currentTarget.value.replace(/\s/g, ""))
    }
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
        field("password", generateRandomPassword());
      }}
    >
      <RefreshCw size={16} />
    </ActionIcon>
  </Tooltip>
</Group>

          <Select
            label="VAT Filing Period"
            mb="md"
            placeholder={isLoadingPeriods ? "Loading..." : "Select a period"}
            disabled={isLoadingPeriods}
            data={filingPeriods.map((p) => ({ value: p.name, label: p.name }))}
            value={formData.vatPeriod}
            onChange={(val) =>
              setFormData({ ...formData, vatPeriod: val || "" })
            }
          />
          <Group justify="flex-end">
            <CommonButton
              variant="default"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancel
            </CommonButton>
            <CommonButton type="submit" loading={isSaving}>
              Save
            </CommonButton>
          </Group>
        </form>
      </Modal>
    </DashboardLayout>
  );
}