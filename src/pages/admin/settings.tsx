import React, { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Plus, Trash2, MoreVertical, Check, X } from "lucide-react";
import { UserRolesEnum } from "@/utils/enums/enum";
import {
  Title,
  Text,
  Paper,
  SimpleGrid,
  TextInput,
  NumberInput,
  Button,
  Group,
  ActionIcon,
  List,
  ThemeIcon,
  Box,
  Divider,
  Stack,
  Badge,
  Menu,
  Skeleton,
} from "@mantine/core";
import {
  APIActiveFillingPeriod,
  APIDeleteFillingPeriodById,
  APIGetFillingPeriod,
  APIPostFillingPeriod,
} from "../../../apis/filling-period";
import {
  APIGetFiscalYear,
  APIPostFiscalYear,
  APIDeleteFiscalYearById,
} from "../../../apis/fiscal-year";

type FilingPeriod = {
  id: string;
  name: string;
  is_active?: boolean;
  active?: boolean;
  status?: boolean | string;
};

type FiscalYear = {
  id: string;
  year: string;
  vat_percent: number;
};

// ---- Skeleton helpers, scoped to this page's list item shapes ----
function FilingPeriodRowSkeleton() {
  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between">
        <Group>
          <Skeleton height={24} width={24} radius="xl" circle />
          <Box>
            <Skeleton height={12} width={120} radius="sm" mb={6} />
            <Skeleton height={10} width={80} radius="sm" />
          </Box>
        </Group>
        <Group gap="xs">
          <Skeleton height={20} width={60} radius="sm" />
          <Skeleton height={28} width={28} radius="sm" />
        </Group>
      </Group>
    </Paper>
  );
}

function FiscalYearRowSkeleton() {
  return (
    <Group justify="space-between" py={4}>
      <Group>
        <Skeleton height={24} width={24} radius="xl" circle />
        <Box>
          <Skeleton height={12} width={90} radius="sm" mb={6} />
          <Skeleton height={10} width={70} radius="sm" />
        </Box>
      </Group>
      <Skeleton height={20} width={20} radius="sm" />
    </Group>
  );
}

export default function SettingsPage() {
  const [filingPeriods, setFilingPeriods] = useState<FilingPeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [newPeriod, setNewPeriod] = useState("");
  const [activePeriodIds, setActivePeriodIds] = useState<string[]>([]);
  const [activePeriodNames, setActivePeriodNames] = useState<string[]>([]);
  const [isLoadingActivePeriod, setIsLoadingActivePeriod] = useState(true);

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [isLoadingFiscalYears, setIsLoadingFiscalYears] = useState(true);

  const [newFiscalYear, setNewFiscalYear] = useState({
    year: "",
    vatAmount: "",
  });

  const getFilingPeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const res = await APIGetFillingPeriod();
      setFilingPeriods(res?.data?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch filing periods", err);
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  const getActivePeriod = async () => {
    setIsLoadingActivePeriod(true);
    try {
      const res = await APIActiveFillingPeriod();
      const rawActive = res?.data?.data ?? res?.data;
      const activePeriods = Array.isArray(rawActive)
        ? rawActive
        : rawActive
          ? [rawActive]
          : [];

      const ids = activePeriods
        .map((period) => {
          const rawId =
            period?.id ??
            period?._id ??
            period?.filing_period_id ??
            period?.filling_period_id;
          return rawId ? String(rawId) : "";
        })
        .filter(Boolean);

      const names = activePeriods
        .map((period) => {
          const rawName = period?.name ?? period?.period_name;
          return rawName ? String(rawName) : "";
        })
        .filter(Boolean);

      setActivePeriodIds(Array.from(new Set(ids)));
      setActivePeriodNames(Array.from(new Set(names)));
    } catch (err) {
      console.error("Failed to fetch active period", err);
    } finally {
      setIsLoadingActivePeriod(false);
    }
  };

  const isPeriodActive = (period: FilingPeriod) => {
    if (activePeriodIds.includes(period.id)) return true;
    if (activePeriodNames.includes(period.name)) return true;
    if (typeof period.is_active === "boolean") return period.is_active;
    if (typeof period.active === "boolean") return period.active;
    if (typeof period.status === "boolean") return period.status;
    if (typeof period.status === "string") {
      return period.status.toLowerCase() === "active";
    }
    return false;
  };

  const getFiscalYears = async () => {
    setIsLoadingFiscalYears(true);
    try {
      const res = await APIGetFiscalYear();
      setFiscalYears(res?.data?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch fiscal years", err);
    } finally {
      setIsLoadingFiscalYears(false);
    }
  };

  React.useEffect(() => {
    getFilingPeriods();
    getActivePeriod();
    getFiscalYears();
  }, []);

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPeriod.trim()) return;

    try {
      await APIPostFillingPeriod({
        name: newPeriod,
      });

      setNewPeriod("");
      await getFilingPeriods();
    } catch (err) {
      console.error("Failed to add filing period", err);
    }
  };

  const handleTogglePeriodStatus = async (id: string) => {
    try {
      await APIDeleteFillingPeriodById(id);
      await getFilingPeriods();
      await getActivePeriod();
    } catch (err) {
      console.error("Failed to toggle filing period status", err);
    }
  };

  const handleAddFiscalYear = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFiscalYear.year || !newFiscalYear.vatAmount) return;

    try {
      await APIPostFiscalYear({
        year: newFiscalYear.year,
        vat_percent: parseFloat(newFiscalYear.vatAmount),
      });

      setNewFiscalYear({ year: "", vatAmount: "" });
      await getFiscalYears();
    } catch (err) {
      console.error("Failed to add fiscal year", err);
    }
  };

  const handleDeleteFiscalYear = async (id: string) => {
    try {
      await APIDeleteFiscalYearById(id);
      await getFiscalYears();
    } catch (err) {
      console.error("Failed to delete fiscal year", err);
    }
  };

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <Box mb="xl">
        <Title order={2}>Settings</Title>
        <Text c="var(--muted-foreground)">
          Manage filing periods and fiscal years.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Title order={3} size="h5">
              VAT Filing Periods
            </Title>
            {isLoadingPeriods ? (
              <Skeleton height={20} width={70} radius="sm" />
            ) : (
              <Badge variant="light">{filingPeriods.length} total</Badge>
            )}
          </Group>
          <Text size="sm" c="var(--muted-foreground)" mb="md">
            Add VAT filing frequencies used when managing clients.
          </Text>

          {isLoadingActivePeriod ? (
            <Skeleton height={12} width="60%" radius="sm" mb="md" />
          ) : (
            <Text size="xs" c="var(--muted-foreground)" mb="md">
              {activePeriodNames.length > 0
                ? `Current active periods: ${activePeriodNames.join(", ")}`
                : activePeriodIds.length > 0
                  ? `${activePeriodIds.length} filing period(s) are active.`
                  : "No active filing period selected."}
            </Text>
          )}

          <form onSubmit={handleAddPeriod}>
            <Group align="flex-end" mb="xl">
              <TextInput
                placeholder="e.g. Bi-monthly"
                label="Period name"
                description="Example: Monthly, Bi-monthly, Quarterly"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.currentTarget.value)}
                style={{ flex: 1 }}
                required
              />
              <Button
                type="submit"
                leftSection={<Plus size={16} />}
                disabled={!newPeriod.trim()}
              >
                Add
              </Button>
            </Group>
          </form>

          {isLoadingPeriods ? (
            <Stack gap="sm">
              <FilingPeriodRowSkeleton />
              <FilingPeriodRowSkeleton />
              <FilingPeriodRowSkeleton />
            </Stack>
          ) : (
            <>
              <Stack gap="sm">
                {filingPeriods.map((period, index) => {
                  const active = isPeriodActive(period);
                  return (
                    <Paper key={period.id} withBorder p="sm" radius="md">
                      <Group justify="space-between">
                        <Group>
                          <ThemeIcon
                            color="var(--primary)"
                            size={24}
                            radius="xl"
                            variant="light"
                          >
                            <Text size="xs" fw={700}>
                              {index + 1}
                            </Text>
                          </ThemeIcon>
                          <Box>
                            <Text fw={500}>{period.name}</Text>
                            <Text size="xs" c="var(--muted-foreground)">
                              Filing frequency
                            </Text>
                          </Box>
                        </Group>

                        <Group gap="xs">
                          <Badge color={active ? "green" : "gray"} variant="light">
                            {active ? "Active" : "Inactive"}
                          </Badge>

                          <Menu withinPortal position="bottom-end" shadow="sm">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray">
                                <MoreVertical size={18} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              {!active ? (
                                <Menu.Item
                                  leftSection={<Check size={14} />}
                                  color="green"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTogglePeriodStatus(period.id);
                                  }}
                                >
                                  Set Active
                                </Menu.Item>
                              ) : (
                                <Menu.Item
                                  leftSection={<X size={14} />}
                                  color="red"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTogglePeriodStatus(period.id);
                                  }}
                                >
                                  Set Inactive
                                </Menu.Item>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>

              {filingPeriods.length === 0 && (
                <Text c="var(--muted-foreground)" ta="center" py="sm">
                  No filing periods added yet.
                </Text>
              )}
            </>
          )}
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Title order={3} size="h5" mb="md">
            Fiscal Years & VAT Amount
          </Title>

          <form onSubmit={handleAddFiscalYear}>
            <Group align="flex-end" mb="xl">
              <TextInput
                placeholder="e.g. 2081/82"
                label="Year"
                value={newFiscalYear.year}
                onChange={(e) =>
                  setNewFiscalYear({
                    ...newFiscalYear,
                    year: e.currentTarget.value,
                  })
                }
                style={{ flex: 1 }}
                required
              />

              <NumberInput
                placeholder="VAT %"
                label="VAT %"
                min={0}
                max={100}
                value={
                  newFiscalYear.vatAmount ? Number(newFiscalYear.vatAmount) : ""
                }
                onChange={(val) =>
                  setNewFiscalYear({
                    ...newFiscalYear,
                    vatAmount: val.toString(),
                  })
                }
                style={{ width: 100 }}
                required
              />

              <Button type="submit" leftSection={<Plus size={16} />}>
                Add
              </Button>
            </Group>
          </form>

          {isLoadingFiscalYears ? (
            <Stack gap="xs">
              <FiscalYearRowSkeleton />
              <Divider my="xs" />
              <FiscalYearRowSkeleton />
            </Stack>
          ) : (
            <>
              <List spacing="sm" size="sm" center>
                {fiscalYears.map((fy, index) => (
                  <React.Fragment key={fy.id}>
                    <List.Item
                      icon={
                        <ThemeIcon
                          color="var(--chart-1)"
                          size={24}
                          radius="xl"
                          variant="light"
                        >
                          <Text size="xs" fw={700}>
                            {index + 1}
                          </Text>
                        </ThemeIcon>
                      }
                    >
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{fy.year}</Text>
                          <Text size="xs" c="var(--muted-foreground)">
                            VAT: {fy.vat_percent}%
                          </Text>
                        </Box>

                        <ActionIcon
                          variant="subtle"
                          color="var(--destructive)"
                          onClick={() => handleDeleteFiscalYear(fy.id)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Group>
                    </List.Item>

                    {index < fiscalYears.length - 1 && <Divider my="xs" />}
                  </React.Fragment>
                ))}
              </List>

              {fiscalYears.length === 0 && (
                <Text c="var(--muted-foreground)" ta="center" py="sm">
                  No fiscal years added yet.
                </Text>
              )}
            </>
          )}
        </Paper>
      </SimpleGrid>
    </DashboardLayout>
  );
}