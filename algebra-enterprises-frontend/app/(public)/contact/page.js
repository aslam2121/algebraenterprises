import Link from 'next/link';

const CONTACT_ITEMS = [
  ['Email', 'info@algebraenterprises.in'],
  ['Location', 'Delhi, India'],
  ['Response Window', 'Same business day for active listing enquiries'],
];

const SUPPORT_AREAS = [
  'Property viewings and shortlist support',
  'Owner and tenant introductions',
  'Sales and rental guidance',
  'Agent portal follow-up on active leads',
];

export default function ContactPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--page-bg)', paddingTop: '80px' }}>
      <section style={{ padding: '4rem 0 2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1rem' }}>
          <p style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Contact
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', maxWidth: '720px', lineHeight: 1.05 }}>
            Start the conversation before the right listing moves.
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '640px', lineHeight: 1.8 }}>
            Reach Algebra Enterprises for a property search, a premium listing discussion, or follow-up on an active enquiry.
          </p>
        </div>
      </section>

      <section style={{ padding: '1rem 0 4rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line-soft)', borderRadius: '20px', padding: '1.8rem' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Reach Us
            </p>
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {CONTACT_ITEMS.map(([label, value]) => (
                <div key={label} style={{ paddingBottom: '0.9rem', borderBottom: '1px solid var(--line-soft)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                    {label}
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, var(--surface-1), var(--surface-2))', border: '1px solid var(--line-gold)', borderRadius: '20px', padding: '1.8rem' }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              We Can Help With
            </p>
            <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.6rem' }}>
              {SUPPORT_AREAS.map((item) => (
                <div key={item} style={{ padding: '0.95rem 1rem', borderRadius: '14px', background: 'var(--surface-3)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <Link href="/properties" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px', background: 'linear-gradient(135deg, var(--red), var(--red-light))', color: 'var(--white)', fontWeight: 600 }}>
                Browse Properties
              </Link>
              <Link href="/agent/login" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px', border: '1px solid var(--gold)', color: 'var(--gold)', fontWeight: 600 }}>
                Agent Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
