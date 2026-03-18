import { LandingNavbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { FeatureGrid } from '@/components/landing/feature-grid'
import { PricingSection } from '@/components/landing/pricing-section'
import { SecuritySection, Footer } from '@/components/landing/footer'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function LandingPage() {
  // Check if user is logged in to conditionally show dashboard link
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      <LandingNavbar />
      <Hero user={user} />
      <FeatureGrid />
      <PricingSection />
      <SecuritySection />
      <Footer />
      
      {/* Premium subtle grain effect overlay (optional but nice) */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] contrast-150 brightness-150" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </main>
  )
}
