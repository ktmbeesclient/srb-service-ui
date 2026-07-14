"use client";
import React, { useMemo } from "react";
import { NepaliDatePicker as BSDatePicker } from "nepali-datepicker-reactjs";
import { ADToBS, BSToAD } from "bikram-sambat-js";
import { Text } from "@mantine/core";

type NepaliDatePickerProps = {
  label?: string;
  /** Current value as an AD "YYYY-MM-DD" string (matches your API/DB format). Empty string = unset. */
  value: string;
  /** Called with an AD "YYYY-MM-DD" string, or "" when cleared. */
  onChange: (adDate: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

/**
 * nepali-datepicker-reactjs shows/collects dates in BS. calenderLocale: "en"
 * just switches its display to English digits/month names — it does NOT
 * convert to Gregorian. This wrapper converts at the boundary so the rest
 * of the app keeps working with AD strings, exactly like the old
 * <TextInput type="date" /> did.
 *
 * The library doesn't reliably support a placeholder prop (see upstream
 * issue puncoz-official/nepali-datepicker-reactjs#19), so we overlay our
 * own placeholder text that only shows while the field is empty.
 *
 * IMPORTANT: this file must NOT import any CSS. Add the library's
 * stylesheet once, in pages/_app.tsx:
 *   import "nepali-datepicker-reactjs/dist/index.css";
 * Next.js's Pages Router throws a build error if global CSS is imported
 * from anywhere other than _app.
 */
export default function NepaliDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  required,
  disabled,
  className = "",
  inputClassName = "nepali-date-input",
}: NepaliDatePickerProps) {
  const bsValue = useMemo(() => {
    if (!value) return "";
    try {
      return ADToBS(value.split("T")[0]);
    } catch {
      return "";
    }
  }, [value]);

  const handleChange = (bsDate: string) => {
    if (!bsDate) {
      onChange("");
      return;
    }
    try {
      onChange(BSToAD(bsDate));
    } catch {
      onChange("");
    }
  };

  return (
    <div
      style={{
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {label && (
        <Text size="sm" fw={500} mb={4}>
          {label}
          {required && <span style={{ color: "var(--destructive)" }}> *</span>}
        </Text>
      )}

      <div style={{ position: "relative" }}>
        <BSDatePicker
          className={className}
          inputClassName={inputClassName}
          value={bsValue}
          onChange={handleChange}
          options={{ calenderLocale: "en", valueLocale: "en" }}
        />

        {!bsValue && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted-foreground)",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            {placeholder}
          </span>
        )}
      </div>

      {error && (
        <Text size="xs" c="var(--destructive)" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
}