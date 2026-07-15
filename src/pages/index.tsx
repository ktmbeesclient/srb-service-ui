import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { UserRolesEnum } from "@/utils/enums/enum";
import Image from "next/image";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({ 
  subsets: ["latin"], 
  variable: "--font-body" 
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const role = getCookie("role");
    if (role === UserRolesEnum.SUPER_ADMIN) {
      router.replace("/admin/clients");
    } else if (role === "CLIENT") {
      router.replace("/client/dashboard");
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  if (checkingSession) {
    return <div className="min-h-screen bg-[#eeece0]" />;
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen flex flex-col bg-[#eeece0] text-[#1e2a22] antialiased`}
      style={{ fontFamily: "var(--font-body), sans-serif" }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-1 py-3 sm:px-12 border-b border-[#d8d3c0]/40">
        <div className="flex items-center gap-3">

<Image
  src="/srbservices.png"
  alt="Srb Services"
  width={1080}
  height={1080}
  className="h-20 w-24"
/>
       
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="rounded-full border border-[#d8d3c0] px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out hover:border-[#3c5a44] hover:bg-[#3c5a44]/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c08a2e] focus-visible:outline-offset-2"
        >
          Log in <span aria-hidden="true" className="inline-block translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </button>
      </header>

      {/* Hero Content */}
      <main className="mx-auto flex max-w-300 flex-2 flex-col items-center justify-center px-6 text-center py-12 sm:px-12">
        <p
          className="mb-4 text-xs font-medium uppercase tracking-widest text-[#3c5a44]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          VAT &amp; transaction records — Nepal
        </p>

        <h1
          className="mb-6 text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1e2a22] sm:text-[54px]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Ledger-grade VAT records kept  <br/> the way auditors keep them.
        </h1>

        <p className="mx-auto mb-8 max-w-[520px] text-[16.5px] Aquarium leading-[1.65] text-[#40493f]">
          Srb Services holds transaction entries, VAT books, and client filings
          in one place — built for firms managing compliance across several
          clients at once, under Nepal’s VAT rules.
        </p>

        {/* Feature Badges */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["Sales & Purchase Registers", "PAN-linked Transactions", "Trimester & Monthly Filing"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#d8d3c0] bg-[#c08a2e]/[0.04] px-3.5 py-1.5 text-[11px] font-medium tracking-[0.03em] text-[#3c5a44] transition-all duration-200 ease-in-out hover:border-[#3c5a44] hover:bg-[#3c5a44]/[0.08]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                {tag}
              </span>
            )
          )}
        </div>

        {/* Primary Action */}
        <div className="flex flex-col items-center gap-3.5">
          <button 
          
            onClick={() => router.push("/login")}
            className="rounded-lg bg-[#1e2a22] px-7 py-3.5 text-[15px] font-semibold text-[#eeece0] shadow-[0_1px_2px_rgba(30,42,34,0.08)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-[#3c5a44] hover:shadow-[0_6px_20px_rgba(60,90,68,0.2)] hover:cursor-pointer active:translate-y-0 active:shadow-[0_1px_2px_rgba(30,42,34,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c08a2e] focus-visible:outline-offset-2"
          >
            Log in to your ledger
          </button>
          {/* <span className="text-[13px] text-[#7a7a68] font-medium">
            For super admins and their clients
          </span> */}
        </div>
      </main>

      {/* Footer Strip */}
 
<footer
  className="border-t border-[#d8d3c0] px-6 py-6 sm:px-12"
  style={{ fontFamily: "var(--font-mono), monospace" }}
>
  <div className="flex flex-col items-center gap-4">
    {/* Features */}
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium tracking-wide text-[#7a7a68]">
      <span>PAN-READY EXPORTS</span>
      <span className="hidden opacity-40 sm:inline">·</span>
      <span>SALES &amp; PURCHASE BOOKS</span>
      <span className="hidden opacity-40 sm:inline">·</span>
      <span>FILING PERIOD TRACKING</span>
    </div>

    {/* Copyright */}
    <div className="border-t border-[#d8d3c0]/60 pt-4 text-center text-[11px] text-[#7a7a68]">
      © {new Date().getFullYear()}{" "}
      <span className="font-semibold text-[#1e2a22]">SRB Services</span>. All
      rights reserved.
    </div>
  </div>
</footer>
    </div>
  );
}