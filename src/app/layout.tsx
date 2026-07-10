import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/src/context/AuthContext";
import { ProductSelectionProvider } from "@/src/context/ProductSelectionContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalog Manager",
  description: "Manage your product catalog",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProductSelectionProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />
          </ProductSelectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
