import "@livekit/components-styles";
import "./globals.css";
import { Public_Sans } from "next/font/google";
import ClientLayout from "./client-layout";
import { SpeedInsights } from "@vercel/speed-insights/next"

const publicSans400 = Public_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${publicSans400.className}`}>
      <body className="h-full bg-background">
        <ClientLayout>{children}
          <SpeedInsights /></ClientLayout>
      </body>
    </html>
  );
}
