import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripRipple — Agent Memory Copilot',
  description: 'Remembers why plans changed. Updates only the people affected.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f1629]">{children}</body>
    </html>
  );
}
