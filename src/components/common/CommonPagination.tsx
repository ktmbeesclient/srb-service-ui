import React from "react";
import { Pagination, Group, PaginationProps } from "@mantine/core";

export function CommonPagination({ ...props }: PaginationProps) {
  return (
    <Group justify="center" mt="15px" mb="xs">
      <Pagination {...props} />
    </Group>
  );
}
