import type { Metadata } from 'next';
import { Marcellus, Jost } from 'next/font/google';
import './globals.css';

const display = Marcellus({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const body = Jost({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Mahesh Vastra Bhandar — Women’s Indian Ethnic Wear, Jhansi',
  description:
    'Lehengas, sarees, suits, gowns and finishing pieces from Manik Chowk, Jhansi. Browse the collection and send an enquiry — our team follows up on WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
