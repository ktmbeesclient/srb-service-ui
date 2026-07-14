import React from 'react';
import { TextInput, TextInputProps } from '@mantine/core';
import { Search } from 'lucide-react';

interface CommonSearchProps extends TextInputProps {
  placeholder?: string;
}

export function CommonSearch({ placeholder = "Search...", ...props }: CommonSearchProps) {
  return (
    <TextInput
      placeholder={placeholder}
      leftSection={<Search size={16} />}
      {...props}
    />
  );
}
