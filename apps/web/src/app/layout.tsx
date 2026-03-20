import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Base MERN - Web",
  description: "Base MERN monorepo frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
