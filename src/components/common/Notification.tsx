import { notifications } from "@mantine/notifications";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import React from "react";

type NotifyOptions = {
  title?: string;
  autoClose?: number | false;
};

export const notifySuccess = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Success",
    message,
    color: "var(--chart-1)",
    icon: React.createElement(CheckCircle2, { size: 18 }),
    autoClose: options?.autoClose ?? 4000,
  });
};

export const notifyError = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Error",
    message,
    color: "var(--destructive)",
    icon: React.createElement(XCircle, { size: 18 }),
    autoClose: options?.autoClose ?? 6000,
  });
};

export const notifyWarning = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Warning",
    message,
    color: "var(--chart-3)",
    icon: React.createElement(AlertTriangle, { size: 18 }),
    autoClose: options?.autoClose ?? 5000,
  });
};

export const notifyInfo = (message: string, options?: NotifyOptions) => {
  notifications.show({
    title: options?.title ?? "Info",
    message,
    color: "var(--primary)",
    icon: React.createElement(Info, { size: 18 }),
    autoClose: options?.autoClose ?? 4000,
  });
};

export const throwIfApiError = (res: any) => {
  const body = res?.data ?? res;
  if (body?.status === "error" || body?.success === false) {
    const err: any = new Error(
      body?.error || body?.message || "Request failed",
    );
    err.response = { data: body };
    throw err;
  }
  return res;
};

export const extractErrorMessage = (
  error: any,
  fallback = "Something went wrong. Please try again.",
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
