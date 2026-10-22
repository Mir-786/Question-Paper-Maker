import type { Metadata } from "next";
import { Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const bengaliSerif = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "পশ্চিমবঙ্গ পর্ষদ প্রশ্নপত্র নির্মাতা | WB Board Question Paper Generator",
  description: "Generate Class 1-12 West Bengal Board Question Papers in Bengali",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className={`${bengaliSerif.className} bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
