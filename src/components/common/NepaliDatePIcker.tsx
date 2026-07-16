"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { NepaliDatePicker as BSDatePicker } from "nepali-datepicker-reactjs";
import { ADToBS, BSToAD } from "bikram-sambat-js";
import { Text } from "@mantine/core";

type NepaliDatePickerProps = {
  label?: string;
  value: string;
  onChange: (adDate: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  calendarPosition?: "below" | "top";
};

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
  calendarPosition = "below",
}: NepaliDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let calendarEl: HTMLElement | null = null;
    let cleanupPositioning: (() => void) | null = null;

    const positionCalendar = () => {
      if (!calendarEl || !root) return;
      const inputRect =
        root.querySelector("input")?.getBoundingClientRect() ??
        root.getBoundingClientRect();
      const calendarWidth = calendarEl.offsetWidth || 300;
      const viewportWidth = window.innerWidth;

      let left = inputRect.left;
      if (left + calendarWidth > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - calendarWidth - 8);
      }

      calendarEl.style.position = "fixed";
      calendarEl.style.left = `${left}px`;
      calendarEl.style.margin = "0";

      if (calendarPosition === "top") {
        // Position the calendar directly above the input using its actual
        // rendered height. offsetHeight is only reliable once the popup has
        // been through a layout pass, which is why this function gets
        // called again (via rAF) right after the element is attached.
        const calendarHeight = calendarEl.offsetHeight || 300;
        const top = inputRect.top - calendarHeight - 4;
        calendarEl.style.top = `${Math.max(8, top)}px`;
      } else {
        calendarEl.style.top = `${inputRect.bottom + 4}px`;
      }
    };

    const attachCalendar = (el: HTMLElement) => {
      calendarEl = el;

      // Hide until we have a real measurement so it never visibly jumps
      // from an estimated position to the correct one.
      el.style.visibility = "hidden";
      positionCalendar();

      requestAnimationFrame(() => {
        if (!calendarEl) return;
        positionCalendar();
        calendarEl.style.visibility = "visible";
      });

      window.addEventListener("scroll", positionCalendar, true);
      window.addEventListener("resize", positionCalendar);

      cleanupPositioning = () => {
        window.removeEventListener("scroll", positionCalendar, true);
        window.removeEventListener("resize", positionCalendar);
      };
    };

    const observer = new MutationObserver(() => {
      const found = root.querySelector<HTMLElement>(".calender");
      if (found && found !== calendarEl) {
        cleanupPositioning?.();
        attachCalendar(found);
      } else if (!found && calendarEl) {
        cleanupPositioning?.();
        calendarEl = null;
      } else if (found && found === calendarEl) {
        // Content inside the open calendar changed (e.g. month/year
        // dropdown toggled) — height may have changed, so reposition.
        positionCalendar();
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupPositioning?.();
    };
  }, [calendarPosition]);

  return (
    <div
      ref={containerRef}
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
              zIndex: 50,
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