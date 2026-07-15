"use client";
import React, { ReactNode, useState, useEffect } from "react";
import { AppShell, Burger, Group, NavLink, Text, Button, ActionIcon, useMantineColorScheme, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import { deleteCookie, getCookie } from "cookies-next";
import { UserRolesEnum } from "@/utils/enums/enum";
import { Users, FileText, Settings, LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen, ReceiptText, ChartNoAxesColumn } from "lucide-react";
import { ApiLogout } from "../../apis/auth";
import Image from "next/image";

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 220;
const MOBILE_WIDTH = 250;
const HEADER_HEIGHT = 80;

interface LayoutProps {
  children: ReactNode;
  role: UserRolesEnum.SUPER_ADMIN | UserRolesEnum.CLIENT;
}

export default function DashboardLayout({ children, role }: LayoutProps) {
  const [opened, { toggle }] = useDisclosure(); // mobile burger - unchanged
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);

  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    try {
      const refreshToken = getCookie("refresh_token") as string;
      if (refreshToken) {
        const res = await ApiLogout(refreshToken);
        console.log("Logout response:", res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      deleteCookie("access_token");
      deleteCookie("refresh_token");
      deleteCookie("client_id");
      deleteCookie("client_role");
      router.push("/login");
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = role === UserRolesEnum.SUPER_ADMIN
    ? [
      { label: "Clients", href: "/admin/clients", icon: <Users size={20} /> },
      { label: "All Transactions", href: "/admin/transactions", icon:<ReceiptText size={20} /> },
      { label: "Reports", href: "/admin/reports", icon: <ChartNoAxesColumn size={20} />},
      { label: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
    ]
    : [
      { label: "My Transactions", href: "/client/dashboard", icon: <FileText size={20} /> },
    ];

  const renderNavItems = (showLabels: boolean) =>
    navItems.map((item) => {
      const link = (
        <NavLink
          key={item.href}
          component={Link}
          href={item.href}
          label={showLabels ? item.label : undefined}
          leftSection={item.icon}
          active={router.pathname.startsWith(item.href)}
          variant="light"
          mb="sm"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            justifyContent: showLabels ? 'flex-start' : 'center',
          }}
        />
      );
      return showLabels ? (
        link
      ) : (
        <Tooltip key={item.href} label={item.label} position="right" withArrow>
          {link}
        </Tooltip>
      );
    });

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      navbar={{
        // mobile gets its own full drawer width; desktop/tablet uses collapsed/pinned width
        width: { base: MOBILE_WIDTH, sm: pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ActionIcon
              variant="default"
              onClick={() => setPinned((p) => !p)}
              size="lg"
              visibleFrom="sm"
              aria-label="Pin sidebar"
            >
              {pinned ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </ActionIcon>
            {/* <Text fw={700} size="lg" onClick={() => router.push("/admin/clients")} style={{ cursor: "pointer" }}>
              Srb Services
            </Text> */}
   <>
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
    src="/dark-theme-logo1.png"
    alt="Srb Services"
    width={1080}
    height={1080}
    priority
    className="h-17 w-20 cursor-pointer ml-2 hover:cursor-pointer [html[data-mantine-color-scheme='light']_&]:hidden"
    onClick={() => router.push("/admin/clients")}
  />
</>
          </Group>
          <Group>
            <Text size="sm" c="var(--muted-foreground)" visibleFrom="sm">{role} Portal</Text>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {mounted &&
                (colorScheme === "dark" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                ))}
            </ActionIcon>
            <Button variant="subtle" color="var(--destructive)" leftSection={<LogOut size={18} />} onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Real navbar: reserves space. On mobile it's the full drawer (labels shown
          whenever opened). On desktop it's the collapsed 72px icon rail, or full
          width if pinned. */}
      <AppShell.Navbar p="sm">
        <AppShell.Section grow>
          {renderNavItems(pinned || opened)}
        </AppShell.Section>
      </AppShell.Navbar>


      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}