import React from 'react';
import { Table, Text, Box } from '@mantine/core';

interface CommonTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function CommonTable({ headers, children, emptyMessage = "No records found.", isEmpty = false }: CommonTableProps) {
  return (
    <Box>
      <Table.ScrollContainer minWidth={800}>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {headers.map((header, idx) => (
                <Table.Th key={idx}>{header}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {children}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {isEmpty && (
        <Text ta="center" p="xl" c="var(--muted-foreground)">{emptyMessage}</Text>
      )}
    </Box>
  );
}
