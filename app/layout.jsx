import "./globals.css";

export const metadata = {
  title: "SPT Bullion",
  description: "Live gold rates, per gram, tola and ounce.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
