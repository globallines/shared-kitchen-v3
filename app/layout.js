import "./globals.css";

export const metadata = {
  title: "Shared Kitchen",
  description: "Two families. One cook. Zero confusion.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.png", apple: "/icon-192.png" },
};

export const viewport = {
  themeColor: "#0f4c3a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
