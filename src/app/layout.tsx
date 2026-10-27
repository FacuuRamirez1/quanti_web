import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
// Valida el contrato de envs en arranque (fail-fast que nombra la faltante).
// Solo código de servidor: este layout es un Server Component (R1/R3).
import "../lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Inter: tipografía primaria de la design spec (escala Display→Caption).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quanti — Vegetales Hidropónicos",
  description:
    "Quanti: vegetales hidropónicos. Estamos preparando nuestro sitio — dejanos tus datos y te avisamos del lanzamiento.",
};

/**
 * Chrome mínimo global: `lang="es"` + skip-link + landmark `main`.
 * SIN header/footer globales: la spec "Landing Próximamente" exige `/`
 * full-bleed (hero desde arriba + footer negro propio), incompatible con el
 * chrome blanco global. Cada ruta pública trae su propio chrome:
 * `/` → hero + about + `FooterNegro`; `/politicas` → barra mínima + `FooterNegro`;
 * `/admin/*` → su propio shell (C-03).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <main id="contenido">{children}</main>
      </body>
    </html>
  );
}
