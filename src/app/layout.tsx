import "./globals.css";

export const metadata = {
  title: "Cybertrend Dashboard",
  description: "Live cybersecurity trend data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased px-4 sm:px-10">
        {children}
      </body>
    </html>
  );
}
