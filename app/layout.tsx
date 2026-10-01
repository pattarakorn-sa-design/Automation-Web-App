import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { themeInitScript } from "@/components/theme";
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
    // suppressHydrationWarning: the script below adds the `dark` class before
    // React hydrates, so the class list differs from what the server rendered.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before the first paint, so there is no white flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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
