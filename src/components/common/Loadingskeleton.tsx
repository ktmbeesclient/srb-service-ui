import React from "react";
import { Box, Group, Paper, Skeleton, SimpleGrid, Stack } from "@mantine/core";

/**
 * Generic reusable loading skeletons.
 * Drop into any page: `{isLoading ? <TableSkeleton /> : <ActualTable />}`
 */

// ---- Form fields (e.g. a row of inputs/selects at the top of a page) ----
export function FormFieldsSkeleton({
  fields = 4,
  cols = { base: 1, sm: 2, lg: 4 },
}: {
  fields?: number;
  cols?: { base?: number; sm?: number; lg?: number };
}) {
  return (
    <SimpleGrid cols={cols} spacing="md" mb="md">
      {Array.from({ length: fields }).map((_, i) => (
        <Box key={i}>
          <Skeleton height={12} width="40%" mb={8} radius="sm" />
          <Skeleton height={36} radius="sm" />
        </Box>
      ))}
    </SimpleGrid>
  );
}

// ---- Table (rows + columns) ----
export function TableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <Box style={{ overflowX: "auto" }}>
      {/* header */}
      <Group gap="md" mb="sm" wrap="nowrap">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} width={100} radius="sm" />
        ))}
      </Group>
      {/* rows */}
      <Stack gap="sm">
        {Array.from({ length: rows }).map((_, r) => (
          <Group key={r} gap="md" wrap="nowrap">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} height={30} width={100} radius="sm" />
            ))}
          </Group>
        ))}
      </Stack>
    </Box>
  );
}

// ---- Card / list item (e.g. a client card, summary tile) ----
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Skeleton height={16} width="50%" mb={12} radius="sm" />
      <Stack gap={8}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={10} width={`${90 - i * 10}%`} radius="sm" />
        ))}
      </Stack>
    </Paper>
  );
}

// ---- Grid of cards (e.g. dashboard summary tiles) ----
export function CardGridSkeleton({
  count = 4,
  cols = { base: 1, sm: 2, lg: 4 },
}: {
  count?: number;
  cols?: { base?: number; sm?: number; lg?: number };
}) {
  return (
    <SimpleGrid cols={cols} spacing="md" mb="md">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </SimpleGrid>
  );
}

// ---- Full-page skeleton: header + fields + table, for a "whole page loading" state ----
export function PageSkeleton({
  showFields = true,
  tableRows = 6,
  tableCols = 6,
}: {
  showFields?: boolean;
  tableRows?: number;
  tableCols?: number;
}) {
  return (
    <Box>
      <Skeleton height={28} width={220} mb="lg" radius="sm" />
      <Paper withBorder radius="md" p="md">
        {showFields && <FormFieldsSkeleton />}
        <TableSkeleton rows={tableRows} cols={tableCols} />
      </Paper>
    </Box>
  );
}