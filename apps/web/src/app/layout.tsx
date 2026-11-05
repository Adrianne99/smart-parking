import { themeStylesheet } from '@smart-parking/design-tokens';
import type { Metadata } from 'next';
import { DM_Mono, Instrument_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

// latin-ext carries U+20B1 (₱); glyph coverage in each font is still to be verified in P1.
const ui = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
  display: 'swap',
});
const data = DM_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

// Static, build-time CSS from our own token module (no user input).
const themeCss = themeStylesheet();

export const metadata: Metadata = {
  title: 'Smart Parking',
  description: 'Operator and platform workspace for Metro Manila Smart Parking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${data.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
