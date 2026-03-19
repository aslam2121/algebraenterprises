import Hero from '@/components/Hero';
import PropertyCard from '@/components/PropertyCard';
import { AreaLink, ViewAllLink, FeatureCard } from '@/components/HomeClientParts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getFeaturedProperties() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/properties?filters[Featured_Property][$eq]=true&filters[Property_Status][$eq]=Live&populate=Images&pagination[limit]=6`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.data || [];
  } catch (e) { return []; }
}

async function getRecentProperties() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/properties?filters[Property_Status][$eq]=Live&populate=Images&pagination[limit]=6&sort=createdAt:desc`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.data || [];
  } catch (e) { return []; }
}

async function getStats() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/properties?pagination[limit]=1`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.meta?.pagination?.total || 265;
  } catch { return 265; }
}

const AREAS = [
  'Vasant Vihar', 'Defence Colony', 'Hauz Khas', 'Chanakyapuri',
  'Golf Links', 'Jor Bagh', 'Vasant Kunj Farms', 'Safdarjung Enclave', 'Anand Niketan',
];

const FEATURES = [
  { icon: '🏛', title: 'Premium Locations', desc: "Exclusive properties across Delhi's most sought-after neighbourhoods" },
  { icon: '🤝', title: 'Trusted Agents',    desc: 'Experienced agents dedicated to finding your perfect property' },
  { icon: '⚡', title: 'Fast Process',       desc: 'Streamlined process from viewing to agreement in record time' },
  { icon: '🔒', title: 'Verified Listings', desc: 'Every property verified and inspected by our expert team' },
];

export default async function Home() {
  const [featured, recent, total] = await Promise.all([
    getFeaturedProperties(),
    getRecentProperties(),
    getStats(),
  ]);

  const displayProperties = featured.length >= 3 ? featured : recent;

  return (
    <main>
      <Hero />

      {/* Areas strip */}
      <section style={{
        borderTop: '1px solid rgba(201,168,76,0.15)',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        padding: '1.2rem 0',
        background: 'rgba(17,34,64,0.5)',
      }}>
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', padding: '0 2rem' }}>
          {AREAS.map(area => <AreaLink key={area} area={area} />)}
        </div>
      </section>

      {/* Featured / Recent Properties */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.6rem' }}>
                ✦ Curated Selection
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: 1.15 }}>
                {featured.length >= 3 ? 'Featured Properties' : 'Latest Properties'}
              </h2>
            </div>
            <ViewAllLink total={total} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {displayProperties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      </section>

      {/* Why Algebra */}
      <section style={{ padding: '6rem 0', background: 'rgba(17,34,64,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.6rem' }}>✦ Our Promise</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>Why Choose Algebra Enterprises</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{
            borderRadius: '24px', padding: '4rem 3rem', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(192,57,43,0.15) 0%, rgba(17,34,64,0.8) 50%, rgba(201,168,76,0.1) 100%)',
            border: '1px solid rgba(201,168,76,0.2)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
              width: '600px', height: '300px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', marginBottom: '1rem', position: 'relative' }}>
              Looking to List Your Property?
            </h2>
            <p style={{ color: '#8a9bb5', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Join Delhi&apos;s most trusted real estate platform and connect with premium buyers and tenants.
            </p>
            <Link href="/contact" style={{
              display: 'inline-block', textDecoration: 'none',
              padding: '0.85rem 2.5rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
              color: '#fff', fontSize: '0.95rem', fontWeight: 600,
              boxShadow: '0 8px 25px rgba(192,57,43,0.4)',
              letterSpacing: '0.02em',
            }}>Get In Touch</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '3rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>Algebra</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '1rem' }}>Enterprises</div>
              <p style={{ fontSize: '0.82rem', color: '#8a9bb5', lineHeight: 1.7 }}>Delhi&apos;s premier real estate company for luxury rentals and sales.</p>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Properties</div>
              {['For Rent', 'For Sale', 'Featured', 'All Areas'].map(l => (
                <div key={l} style={{ marginBottom: '0.5rem' }}>
                  <Link href="/properties" style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#8a9bb5' }}>{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Company</div>
              {[
                ['About Us', '/about'],
                ['Our Team', '/about#team'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <div key={label} style={{ marginBottom: '0.5rem' }}>
                  <Link href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#8a9bb5' }}>{label}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Contact</div>
              <p style={{ fontSize: '0.85rem', color: '#8a9bb5', lineHeight: 1.8 }}>Delhi, India<br />info@algebraenterprises.in</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8a9bb5' }}>© 2026 Algebra Enterprises. All rights reserved.</span>
            <span style={{ fontSize: '0.78rem', color: '#8a9bb5' }}>Premium Real Estate · Delhi</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
