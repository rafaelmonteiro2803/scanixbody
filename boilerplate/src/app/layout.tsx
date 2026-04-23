/**
 * MY APP – Root Layout
 *
 * TODO: Update the metadata title, description, and Open Graph values.
 * TODO: Add your custom font imports if needed.
 */

import type { Metadata } from 'next';
import React from 'react';
import { AppProviders } from '@/components/providers/AppProviders';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'My App',       // TODO: replace with your app name
    template: '%s | My App',
  },
  description: 'My App description', // TODO: replace
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"> {/* TODO: change lang to match your locale */}
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
