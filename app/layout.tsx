import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'StripeFlow Merchant POS & Terminal',
  description: 'Professional Stripe Point of Sale with manual punch transactions, offline store & forward, transaction ledger, and AI sales assistant.',
  openGraph: {
    title: 'StripeFlow Merchant POS & Terminal',
    description: 'Professional Stripe Point of Sale with manual punch transactions, offline store & forward, transaction ledger, and AI sales assistant.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StripeFlow Merchant POS & Terminal',
    description: 'Professional Stripe Point of Sale with manual punch transactions, offline store & forward, transaction ledger, and AI sales assistant.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
