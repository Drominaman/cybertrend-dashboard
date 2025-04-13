import "./globals.css";

export const metadata = {
  title: "Cybertrend Dashboard",
  description: "Live cybersecurity trend data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased font-sans">
        <div className="min-h-screen flex flex-col">
          <header className="w-full border-b px-4 py-3 bg-white">
            <div className="max-w-5xl mx-auto text-xl font-semibold">
              Cybertrend Dashboard
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>

          <footer className="w-full border-t px-4 py-3 text-sm text-center text-gray-500 bg-gray-50">
            &copy; {new Date().getFullYear()} Cybertrend. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}
