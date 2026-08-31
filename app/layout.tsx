import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IEFI 2026 · ENSA Carbó",
  description:
    "Cronograma interactivo de las Instancias Evaluativas Finales Integradoras 2026 de ENSA Carbó.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}