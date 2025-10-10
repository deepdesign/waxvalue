import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WaxValue - Keep your Discogs prices in sync with the market',
  description: 'A consumer-friendly web app that checks Discogs listings against wider marketplace data and suggests price changes.',
  keywords: 'discogs, vinyl, records, pricing, marketplace, music',
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
        <Providers>
          {children}
          <ToasterClient />
        </Providers>
      </body>
    </html>
  )
}
