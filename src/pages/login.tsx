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
  SegmentedControl,
} from "@mantine/core";
import { ShieldCheck, Hash, Lock, User } from "lucide-react";
import { ApiLogin, Login as LoginPayload } from "../../apis/auth";
import { setCookie } from "cookies-next";
import { decodeAccessToken } from "@/utils/jwt";
import Image from "next/image";
import showNotify from "@/utils/notify";

type LoginMode = "client" | "admin";

export default function Login() {
  const [loginMode, setLoginMode] = useState<LoginMode>("client");
  const [panNumber, setPanNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleModeChange = (value: string) => {
    setLoginMode(value as LoginMode);
    setPanNumber("");
    setName("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: LoginPayload =
        loginMode === "client"
          ? { pan_number: parseInt(panNumber), password }
          : { name, password };

      const res = await ApiLogin(payload);

      const accessToken = res?.data?.data?.access_token;
      const refreshToken = res?.data?.data?.refresh_token;
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      setCookie("access_token", accessToken);
      setCookie("refresh_token", refreshToken);

     const payloadToken = decodeAccessToken(accessToken);

console.log("Decoded Token:", payloadToken);
console.log("Role:", payloadToken.client_role);

setCookie("client_id", payloadToken.client_id);
setCookie("client_role", payloadToken.client_role);

if (payloadToken.client_role === "SUPER_ADMIN") {
  console.log("Redirecting to admin clients");
  const success = await router.push("/admin/clients");

console.log("Navigation result:", success);
console.log("Current route:", router.pathname);
} else if (payloadToken.client_role === "CLIENT") {
  console.log("Redirecting to client dashboard");
  await router.push("/client/dashboard");
} else {
  console.log("Unknown role:", payloadToken.client_role);
  await router.push("/login");
}
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Invalid credentials. Please try again.";

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
                src="/light-theme-logo.png"
                alt="Srb Services"
                width={1080}
                height={1080}
                priority
                className="h-17 w-20 cursor-pointer ml-2 hover:cursor-pointer [html[data-mantine-color-scheme='dark']_&]:hidden"
                onClick={() => router.push("/admin/clients")}
              />
              <Image
                src="/dark-theme-logo.png"
                alt="Srb Services"
                width={1080}
                height={1080}
                priority
                className="h-17 w-20 cursor-pointer ml-2 hover:cursor-pointer [html[data-mantine-color-scheme='light']_&]:hidden"
                onClick={() => router.push("/admin/clients")}
              />
            </div>
          </Stack>

          <SegmentedControl
            fullWidth
            mt="lg"
            radius="md"
            size="md"
            color="green"
            value={loginMode}
            onChange={handleModeChange}
            data={[
              { label: "Client Login", value: "client" },
              { label: "Admin Login", value: "admin" },
            ]}
          />

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {loginMode === "client" ? (
              <TextInput
                label="PAN Number"
                placeholder="Enter PAN Number"
                value={panNumber}
                onChange={(e) => setPanNumber(e.currentTarget.value)}
                required
                radius="md"
                size="md"
                leftSection={<Hash size={16} color="#64748b" />}
                styles={{
                  label: { color: "#1e293b", fontWeight: 600 },
                  input: {
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    borderColor: "#d1d5db",
                  },
                }}
              />
            ) : (
              <TextInput
                label="Name"
                placeholder="Enter Admin Name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
                radius="md"
                size="md"
                leftSection={<User size={16} color="#64748b" />}
                styles={{
                  label: { color: "#1e293b", fontWeight: 600 },
                  input: {
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    borderColor: "#d1d5db",
                  },
                }}
              />
            )}

            <PasswordInput
              label="Password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              radius="md"
              size="md"
              leftSection={<Lock size={16} color="#64748b" />}
              styles={{
                label: { color: "#1e293b", fontWeight: 600 },
                input: {
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  borderColor: "#d1d5db",
                },
                innerInput: { color: "#111827" },
                visibilityToggle: { color: "#64748b" },
              }}
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