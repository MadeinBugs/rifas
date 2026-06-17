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

// URL base do site, usada para gerar URLs absolutas das imagens de preview
// (og:image / twitter:image). Em produção na Vercel, usamos a URL de produção;
// localmente, caímos no localhost.
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Ação Solidária pelo Suspiro 🐱",
  description:
    "Ação entre amigos para ajudar no tratamento do Suspiro. Escolha um número e participe — cada número é um abraço a mais nessa luta. 💛",
  openGraph: {
    title: "Salve o Suspiro",
    description:
      "Ajude no tratamento do Suspiro. Escolha um número e participe dessa ação entre amigos. 💛",
    siteName: "Salve o Suspiro",
    url: "/",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salve o Suspiro",
    description:
      "Ajude no tratamento do Suspiro. Escolha um número e participe dessa ação entre amigos. 💛",
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
