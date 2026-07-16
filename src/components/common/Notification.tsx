import { notifications } from "@mantine/notifications";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";


type NotifyOptions = {
  title?: string;
  autoClose?: number | false;
};

// NOTE: We deliberately do NOT use CSS variables (var(--foreground) etc.)
// here. In this project those variables are resolving to a light/muted grey
// (likely a --muted-foreground-style token, or overridden by a parent theme
// class), which is why text kept rendering dim no matter what override
// strategy was used. Hardcoded hex values guarantee contrast regardless of
// what the theme variables currently evaluate to.
const TEXT_DARK = "#000000"; // near-black, for title
const TEXT_BODY = "#262626"; // slightly softer than pure black, for description
const BG_LIGHT = "#ffffff";
const BORDER_LIGHT = "#e5e5e5";

const baseStyles = {
  root: {
    backgroundColor: BG_LIGHT,
    border: `1px solid ${BORDER_LIGHT}`,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  body: {
    color: TEXT_BODY,
  },
  title: {
    color: TEXT_DARK,
    fontWeight: 700,
    fontSize: "15px",
    lineHeight: 1.3,
    marginBottom: "2px",
    opacity: 1,
  },
  description: {
    color: TEXT_BODY,
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: 1.5,
    opacity: 1,
  },
  closeButton: {
    color: TEXT_BODY,
  },
};

// Tailwind classNames as a belt-and-suspenders backup — !important forces
// these to win even if Mantine's own stylesheet loads after this one.
const baseClassNames = {
  root: "!bg-white !border !border-neutral-200",
  body: "!text-neutral-900",
  title: "!text-neutral-900 !font-bold !text-[15px] !leading-[1.3] !mb-0.5 !opacity-100",
  description: "!text-neutral-800 !font-medium !text-sm !leading-relaxed !opacity-100",
  closeButton: "!text-neutral-700 hover:!bg-neutral-100",
  icon: "!bg-transparent",
};

export const notifySuccess = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Success",
    message,
    color: "#16a34a",
    icon: <CheckCircle2 size={18} />,
    autoClose: options?.autoClose ?? 4000,
    styles: baseStyles,
    classNames: baseClassNames,
  });
};

export const notifyError = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Error",
    message,
    color: "#dc2626",
    icon: <XCircle size={18} />,
    autoClose: options?.autoClose ?? 6000,
    styles: baseStyles,
    classNames: baseClassNames,
  });
};

export const notifyWarning = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Warning",
    message,
    color: "#d97706",
    icon: <AlertTriangle size={18} />,
    autoClose: options?.autoClose ?? 5000,
    styles: baseStyles,
    classNames: baseClassNames,
  });
};

export const notifyInfo = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Info",
    message,
    color: "#2563eb",
    icon: <Info size={18} />,
    autoClose: options?.autoClose ?? 4000,
    styles: baseStyles,
    classNames: baseClassNames,
  });
};

export const throwIfApiError = (res: any) => {
  const body = res?.data ?? res;

  if (body?.status === "error" || body?.success === false) {
    const err: any = new Error(
      body?.error || body?.message || "Request failed"
    );
    err.response = { data: body };
    throw err;
  }

  return res;
};

export const extractErrorMessage = (
  error: any,
  fallback = "Something went wrong. Please try again."
): string => {
  const data = error?.response?.data ?? error?.data ?? {};

  const rawError: string = data?.error || "";
  const rawMessage: string = data?.message || "";
  const combined = `${rawError} ${rawMessage}`.trim();

  if (/duplicate key/i.test(combined) || /unique constraint/i.test(combined)) {
    if (/pan_no/i.test(combined)) {
      return "This PAN number is already registered to another client.";
    }

    if (/slug/i.test(combined) || /name/i.test(combined)) {
      return "A client with this name already exists.";
    }

    return "This record already exists.";
  }

  return rawError || rawMessage || error?.message || fallback;
};