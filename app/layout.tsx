import '@/lib/env';

import './globals.css';

import { TopNavBar } from '@/components/TopNavBar';

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNavBar />
        {children}
      </body>
    </html>
  );
}
