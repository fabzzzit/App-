import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  title: "MentorChess — Juega, aprende y piensa como jugador de ajedrez",
  description:
    "Juega contra bots de 100 a 3500 de Elo, aprende aperturas y deja que un entrenador te explique tus errores.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#262522",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <RegisterSW />
        <Nav />
        <main className="pb-20 sm:pb-8">{children}</main>
      </body>
    </html>
  );
}
