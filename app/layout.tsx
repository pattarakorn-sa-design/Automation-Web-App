import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Alarm & Maintenance",
    template: "%s | Alarm & Maintenance",
  },
  description: "Machine, alarm and maintenance management for the factory floor.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Null when nobody is signed in, so the navbar never shows on /login.
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user ? (
          <Navbar
            user={{ fullName: user.fullName, role: user.role }}
            signOutAction={signOut}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
