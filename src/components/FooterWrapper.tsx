'use client'

import dynamic from 'next/dynamic'
import { Logo } from './Logo'

const Footer = dynamic(() => import('@/components/Footer'), { ssr: false })

export default function FooterWrapper() {
  return (
    <Footer
      logo={<Logo variant="horizontal" size="md" />}
      strapline="Keep your Discogs prices in sync with the market"
      homeLink="/"
      settingsLink="/settings"
    />
  )
}

