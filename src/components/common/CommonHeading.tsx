import React from 'react';
import { Title, Text, Box, TitleProps, Group } from '@mantine/core';

interface CommonHeadingProps extends TitleProps {
  title: string;
  description?: string;
  rightSection?: React.ReactNode;
}

export function CommonHeading({ title, description, rightSection, ...props }: CommonHeadingProps) {
  return (
    <Group justify="space-between" align="flex-end" mb="xl">
      <Box>
        <Title order={2} {...props}>{title}</Title>
        {description && <Text c="var(--muted-foreground)">{description}</Text>}
      </Box>
      {rightSection && (
        <Box>
          {rightSection}
        </Box>
      )}
    </Group>
  );
}
