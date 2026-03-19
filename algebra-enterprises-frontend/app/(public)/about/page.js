import Link from 'next/link';

const PRINCIPLES = [
  {
    title: 'Curated Stock',
    body: 'We focus on premium Delhi inventory instead of carrying every listing in the market.',
  },
  {
    title: 'Local Knowledge',
    body: 'Neighbourhood nuance matters in Delhi, so we advise at the micro-market level, not just by district.',
  },
  {
    title: 'Responsive Execution',
    body: 'Shortlists, viewings, negotiations, and paperwork move on a tight loop so clients do not lose momentum.',
  },
];

const TEAM = [
  'Residential leasing specialists for premium South and Central Delhi inventory.',
  'Sales advisors focused on family homes, independent houses, and long-term investment stock.',
  'Operations support for viewings, follow-ups, and documentation coordination.',
];

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px' }}>
      <section style={{ padding: '4rem 0 2rem', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <p style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            About Algebra Enterprises
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', maxWidth: '760px', lineHeight: 1.05 }}>
            Premium real estate guidance built for Delhi&apos;s most competitive neighbourhoods.
          </h1>
          <p style={{ color: 'var(--muted)', maxWidth: '680px', lineHeight: 1.8, fontSize: '1rem' }}>
            Algebra Enterprises is building a modern property experience around strong local knowledge, premium listing quality,
            and faster execution for buyers, tenants, landlords, and agents.
          </p>
        </div>
      </section>

      <section style={{ padding: '3rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(17,34,64,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.8rem' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
              What We Do
            </p>
            <p style={{ color: '#d5dfef', lineHeight: 1.85 }}>
              The platform combines a public property catalogue with an internal agent workflow. Clients can browse live inventory,
              review property detail pages, and send enquiries, while agents track assigned stock and follow leads through the dashboard.
            </p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(192,57,43,0.16), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '20px', padding: '1.8rem' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
              Focus Areas
            </p>
            <p style={{ color: '#fff', lineHeight: 1.75 }}>
              Rentals, sales, luxury apartments, independent houses, service apartments, and curated premium neighbourhoods across Delhi.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 3rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {PRINCIPLES.map((item) => (
              <article key={item.title} style={{ background: 'rgba(17,34,64,0.72)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.8rem' }}>{item.title}</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="team" style={{ padding: '0 0 4rem' }}>
        <div className="container" style={{ background: 'rgba(17,34,64,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '2rem' }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.9rem' }}>
            Team
          </p>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', marginBottom: '1rem' }}>A structure built for field execution.</h2>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            {TEAM.map((item) => (
              <div key={item} style={{ padding: '1rem 1.1rem', borderRadius: '14px', background: 'rgba(10,22,40,0.6)', color: '#d5dfef', lineHeight: 1.7 }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/contact" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px', background: 'linear-gradient(135deg, var(--red), var(--red-light))', color: '#fff', fontWeight: 600 }}>
              Contact The Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
