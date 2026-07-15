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
import { ApiLogin } from "../../apis/auth";
import { setCookie } from "cookies-next";
import { decodeAccessToken } from "@/utils/jwt";
import Image from "next/image";
import showNotify from "@/utils/notify";


export default function Login() {
  const [panNumber, setPanNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await ApiLogin({
        pan_number: parseInt(panNumber),
        password,
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

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Invalid PAN number or password. Please try again.";

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
                src="/dark-theme-logo.png"
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

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
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