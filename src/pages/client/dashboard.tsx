import React, { useState } from "react";
import { useRouter } from "next/router";

import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Text,
  Stack,
} from "@mantine/core";
import { ShieldCheck, Hash, Lock } from "lucide-react";

import { setCookie } from "cookies-next";
import { decodeAccessToken } from "@/utils/jwt";
import Image from "next/image";
import { ApiLogin } from "../../../apis/auth";
import showNotify from "@/utils/notify";
import { Controller, useForm } from "react-hook-form";


type LoginFormValues = {
  panNumber: string;
  password: string;
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      panNumber: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const res = await ApiLogin({
        pan_number: parseInt(values.panNumber),
        password: values.password,
      });

      const accessToken = res.data.data.access_token;
      const refreshToken = res.data.data.refresh_token;

      setCookie("access_token", accessToken);
      setCookie("refresh_token", refreshToken);

      const payload = decodeAccessToken(accessToken);

      setCookie("client_id", payload.client_id);
      setCookie("client_role", payload.client_role);

      if (payload.client_role === "SUPER-ADMIN") {
        router.push("/admin/clients");
      } else if (payload.client_role === "CLIENT") {
        router.push("/client/dashboard");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      console.error(err);

      const apiMessage = err?.response?.data?.message;
      const message =
        typeof apiMessage === "string" && apiMessage.trim().length > 0
          ? apiMessage
          : "Login failed. Please check your PAN number and password.";

      showNotify("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f8f7f2] via-[#f2f1ea] to-[#ebe8db] flex items-center justify-center px-4 py-8">
      <Container size={420} className="w-full">
        <Paper
          withBorder
          shadow="xl"
          radius="lg"
          p={36}
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
          }}
        >
          <Stack align="center" gap="xs">
            <div className="relative w-22.5 h-22.5 flex items-center justify-center">
              <Image
                src="/srbservices.png"
                alt="SRB Services"
                width={100}
                height={90}
                className="object-contain"
                priority
              />
            </div>

            {/* <div className="text-center mt-2">
              <Title order={2} fw={800} className="text-slate-800 tracking-tight">
                Welcome Back
              </Title>
              <Text c="dimmed" size="xs" mt={4} fw={500}>
                Secure Billing & VAT Management System
              </Text>
            </div> */}
          </Stack>

          <form onSubmit={handleSubmit(handleLogin)} className="mt-8 space-y-4">
            <Controller
              name="panNumber"
              control={control}
              rules={{
                required: "PAN number is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "PAN number must contain digits only",
                },
              }}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="PAN Number"
                  placeholder="Enter PAN Number"
                  required
                  radius="md"
                  size="md"
                  error={errors.panNumber?.message}
                  leftSection={<Hash size={16} color="#64748b" />}
                  styles={{
                    label: {
                      color: "#1e293b",
                      fontWeight: 600,
                    },
                    input: {
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      borderColor: "#d1d5db",
                    },
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: "Password is required",
                minLength: {
                  value: 4,
                  message: "Password must be at least 4 characters",
                },
              }}
              render={({ field }) => (
                <PasswordInput
                  {...field}
                  label="Password"
                  placeholder="Enter Password"
                  required
                  radius="md"
                  size="md"
                  error={errors.password?.message}
                  leftSection={<Lock size={16} color="#64748b" />}
                  styles={{
                    label: {
                      color: "#1e293b",
                      fontWeight: 600,
                    },
                    input: {
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      borderColor: "#d1d5db",
                    },
                    innerInput: {
                      color: "#111827",
                    },
                    visibilityToggle: {
                      color: "#64748b",
                    },
                  }}
                />
              )}
            />

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={loading}
              radius="md"
              size="md"
              color="green"
              className="bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Sign In
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-8 text-slate-400">
            <ShieldCheck size={14} className="text-emerald-600" />
            <Text size="xs" c="dimmed" ta="center" className="select-none">
              © {new Date().getFullYear()} SRB Services • Secure Portal
            </Text>
          </div>
        </Paper>
      </Container>
    </div>
  );
}