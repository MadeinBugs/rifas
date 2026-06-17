import type { Metadata } from "next";
import { Baloo_2, Quicksand, Nunito, Caveat } from "next/font/google";
import "./globals.css";

// Display: nome do Suspiro, títulos dos atos, números grandes.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Subtítulos de seção.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Corpo de texto + números.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// Acentos manuscritos: legendas das fotos, recadinhos.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  ),
  title: "Ação Solidária pelo Suspiro 🐱",
  description:
    "Ação entre amigos para ajudar no tratamento do Suspiro. Escolha um número e participe — cada número é um abraço a mais nessa luta. 💛",
  openGraph: {
    title: "Salve o Suspiro",
    description:
      "Ação entre amigos para ajudar no tratamento do Suspiro. Escolha um número e participe — cada número é um abraço a mais nessa luta. 💛",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salve o Suspiro",
    description:
      "Ação entre amigos para ajudar no tratamento do Suspiro. Escolha um número e participe — cada número é um abraço a mais nessa luta. 💛",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${baloo.variable} ${quicksand.variable} ${nunito.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
