# Landing Page Alternatives

2 carefully selected landing page designs for waxvalue, each with modern CSS animations and effects.

## Preview

Visit `/landing-preview` in your browser to see both designs in action.

## Designs

### 1. **Hero Split** (`landing-hero-split.tsx`)
- Split-screen layout
- Logo at top left
- Content on left with tight letter spacing on headline
- Vinyl records hero image on right (edge-to-edge)
- Floating animated elements
- **Best for**: Professional, modern SaaS feel with balanced visual appeal

### 2. **Gradient Wave** (`landing-gradient-wave.tsx`)
- Vibrant purple/pink gradient background
- Animated SVG waves
- Dashboard screenshot preview (flat, no tilt)
- Extra top spacing
- **Best for**: Energy, movement, and showing the actual product

## Usage

1. Preview both designs at `/landing-preview`
2. Choose your favourite
3. Replace the `WelcomePage` component import in `src/app/page.tsx`

Example:
```tsx
// Replace this:
import { WelcomePage } from '@/components/WelcomePage'

// With this (for Hero Split design):
import { LandingHeroSplit as WelcomePage } from '@/components/landing-alternatives'

// Or this (for Gradient Wave design):
import { LandingGradientWave as WelcomePage } from '@/components/landing-alternatives'
```

## Features

Each design includes:
- ✅ waxvalue logo (theme-aware: light/dark variants)
- ✅ Real hero images (vinyl photos or dashboard screenshot)
- ✅ Single CTA button ("Connect with Discogs")
- ✅ CSS animations (no external libraries)
- ✅ Responsive design
- ✅ Dark mode support (where applicable)
- ✅ British sentence case for headlines

## Customization

All designs use:
- Tailwind CSS for styling
- Inline `<style jsx>` for custom animations
- Images from `/public/images/`
- Logos from `/public/svg/`

### Animation Highlights

- **Fade in/out**: Smooth opacity transitions
- **Slide up/down**: Y-axis movement
- **Float**: Gentle up/down movement
- **Gradient shift**: Animated color transitions
- **Wave**: SVG wave animations (Gradient Wave)
- **Bounce**: Slow bounce on badge elements

## Browser Support

All designs work on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Questions?

Review each design at `/landing-preview` and choose the one that best matches your brand!
