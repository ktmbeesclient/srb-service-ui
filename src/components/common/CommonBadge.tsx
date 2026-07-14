import React from 'react';
import { Badge, BadgeProps } from '@mantine/core';

export function CommonBadge({ children, ...props }: BadgeProps) {
  return (
    <Badge variant="light" {...props}>
      {children}
    </Badge>
  );
}
