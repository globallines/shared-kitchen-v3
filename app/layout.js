import "./globals.css";
import { Playfair_Display } from "next/font/google";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "Shared Kitchen",
  description: "Two families. One cook. Zero confusion.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={serif.variable}>
      <body>{children}</body>
    </html>
  );
}
