export const metadata = {
  title: "Shared Kitchen",
  description: "Two families, one cook.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#faf7f2", color: "#1c2b25",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
