import React, { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { UserRolesEnum } from "@/utils/enums/enum";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Users,
  Undo2,
  FileText,
} from "lucide-react";
import {
  Title,
  Text,
  Box,
  SimpleGrid,
  Paper,
  Group,
  Table,
  Center,
  Skeleton,
} from "@mantine/core";
import { CommonHeading, CommonTable } from "@/components/common";
import { CardGridSkeleton, TableSkeleton } from "@/components/common/Loadingskeleton";


export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);

  // TODO: replace with your real data-fetching loading flag
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      label: "Total Revenue",
      value: "Rs. 2.4M",
      change: "+12.5%",
      trend: "up",
      icon: <Banknote size={18} color="var(--muted-foreground)" />,
    },
    {
      label: "Active Clients",
      value: "45",
      change: "+5.2%",
      trend: "up",
      icon: <Users size={18} color="var(--muted-foreground)" />,
    },
    {
      label: "Pending Returns",
      value: "12",
      change: "-2.4%",
      trend: "down",
      icon: <Undo2 size={18} color="var(--muted-foreground)" />,
    },
    {
      label: "Total Transactions",
      value: "1,240",
      change: "+18.1%",
      trend: "up",
      icon: <FileText size={18} color="var(--muted-foreground)" />,
    },
  ];

  return (
    <DashboardLayout role={UserRolesEnum.SUPER_ADMIN}>
      <CommonHeading
        title="Reports & Analytics"
        description="Overview of system performance and audit metrics."
      />

      {isLoading ? (
        <CardGridSkeleton count={4} cols={{ base: 1, sm: 2, lg: 4 }} />
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg" mb="xl">
          {stats.map((stat, i) => (
            <Paper key={i} withBorder p="md" radius="md">
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" c="var(--muted-foreground)" fw={500}>
                  {stat.label}
                </Text>
                {stat.icon}
              </Group>
              <Group align="flex-end" gap="xs" mt={5}>
                <Text size="xl" fw={700}>
                  {stat.value}
                </Text>
                <Text
                  size="sm"
                  fw={500}
                  c={
                    stat.trend === "up"
                      ? "var(--chart-1)"
                      : "var(--destructive)"
                  }
                  display="flex"
                  style={{ alignItems: "center" }}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {stat.change}
                </Text>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Title order={3} size="h4" mb="md">
            Revenue Over Time
          </Title>
          {isLoading ? (
            <Skeleton height={250} radius="md" />
          ) : (
            <Box
              h={250}
              style={{
                border: "1px dashed var(--mantine-color-default-border)",
                borderRadius: "var(--mantine-radius-md)",
              }}
            >
              <Center h="100%">
                <Group gap="xs" c="var(--muted-foreground)">
                  <TrendingUp size={20} />
                  <Text>Chart Area</Text>
                </Group>
              </Center>
            </Box>
          )}
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Title order={3} size="h4" mb="md">
            Top Clients by Volume
          </Title>
          {isLoading ? (
            <TableSkeleton rows={3} cols={3} />
          ) : (
            <CommonTable
              headers={["Client Name", "Transactions", "Total Value"]}
              isEmpty={false}
            >
              <Table.Tr>
                <Table.Td>Acme Corp</Table.Td>
                <Table.Td>145</Table.Td>
                <Table.Td>Rs. 450,000</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Global Tech</Table.Td>
                <Table.Td>92</Table.Td>
                <Table.Td>Rs. 280,000</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Everest Supplies</Table.Td>
                <Table.Td>56</Table.Td>
                <Table.Td>Rs. 125,000</Table.Td>
              </Table.Tr>
            </CommonTable>
          )}
        </Paper>
      </SimpleGrid>
    </DashboardLayout>
  );
}