import React from 'react';
import { Box, Text, Chip, Group } from '@mantine/core';

interface FilterOption {
  label: string;
  value: string;
}

interface CommonFilterProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
}

export function CommonFilter({
  label,
  value,
  onChange,
  options,
  allLabel = "All"
}: CommonFilterProps) {
  return (
    <Box>
      <Text size="sm" fw={500} mb="xs" c="var(--muted-foreground)">{label}</Text>
      <Chip.Group multiple={false} value={value} onChange={(val) => onChange(val as string)}>
        <Group gap="xs">
          <Chip value="">{allLabel}</Chip>
          {options.map((opt) => (
            <Chip key={opt.value} value={opt.value}>{opt.label}</Chip>
          ))}
        </Group>
      </Chip.Group>
    </Box>
  );
}
