import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { DisableDevTools } from '@/components/DisableDevTools'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Waxvalue - Keep your Discogs prices in sync with the market',
  description: 'A consumer-friendly web app that checks Discogs listings against wider marketplace data and suggests price changes.',
  keywords: 'discogs, vinyl, records, pricing, marketplace, music',
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    shortcut: '/favicon-32x32.png?v=2',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

const ToasterClient = dynamic(() => import('@/components/ToasterClient'))

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <DisableDevTools />
        <style dangerouslySetInnerHTML={{__html: `
          /* Hide I-beam cursor everywhere, but allow text selection */
          * {
            cursor: default !important;
          }
          /* Hide blinking caret in input fields */
          input, textarea, [contenteditable="true"] {
            caret-color: transparent !important;
          }
          /* Show pointer cursor for interactive elements */
          button, a, [role="button"], input[type="checkbox"], input[type="radio"], label { 
            cursor: pointer !important; 
          }
        `}} />
        <Providers>
          {children}
          <ToasterClient />
        </Providers>
      </body>
    </html>
  )
}
