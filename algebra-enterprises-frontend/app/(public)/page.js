import Hero from '@/components/Hero';
import PropertyCard from '@/components/PropertyCard';
import { AreaLink, ViewAllLink, FeatureCard } from '@/components/HomeClientParts';
import { STRAPI_BASE_URL } from '@/lib/strapi';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getFeaturedProperties() {
  try {
    const res = await fetch(
      `${STRAPI_BASE_URL}/api/properties?filters[Featured_Property][$eq]=true&filters[Property_Status][$eq]=Live&populate=Images&pagination[limit]=6`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.data || [];
  } catch (e) { return []; }
}

async function getRecentProperties() {
  try {
    const res = await fetch(
      `${STRAPI_BASE_URL}/api/properties?filters[Property_Status][$eq]=Live&populate=Images&pagination[limit]=6&sort=createdAt:desc`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.data || [];
  } catch (e) { return []; }
}

async function getStats() {
  try {
    const res = await fetch(
      `${STRAPI_BASE_URL}/api/properties?pagination[limit]=1`,
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
        borderTop: '1px solid var(--line-gold)',
        borderBottom: '1px solid var(--line-gold)',
        padding: '1.2rem 0',
        background: 'var(--surface-2)',
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
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.6rem' }}>
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
      <section style={{ padding: '6rem 0', background: 'var(--surface-2)', borderTop: '1px solid var(--line-soft)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.6rem' }}>✦ Our Promise</div>
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
            background: 'linear-gradient(135deg, rgba(192,57,43,0.12) 0%, var(--surface-1) 50%, rgba(201,168,76,0.14) 100%)',
            border: '1px solid var(--line-gold)',
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
            <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Join Delhi&apos;s most trusted real estate platform and connect with premium buyers and tenants.
            </p>
            <Link href="/contact" style={{
              display: 'inline-block', textDecoration: 'none',
              padding: '0.85rem 2.5rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
              color: 'var(--white)', fontSize: '0.95rem', fontWeight: 600,
              boxShadow: '0 8px 25px rgba(192,57,43,0.4)',
              letterSpacing: '0.02em',
            }}>Get In Touch</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
