import Link from 'next/link';

const PROPERTY_LINKS = [
  ['For Rent', '/properties?type=rent'],
  ['For Sale', '/properties?type=sale'],
  ['Featured', '/properties'],
  ['All Areas', '/properties'],
];

const COMPANY_LINKS = [
  ['About Us', '/about'],
  ['Our Team', '/about#team'],
  ['Contact', '/contact'],
];

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line-soft)', padding: '3rem 0 2rem', background: 'var(--surface-3)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>Algebra</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1rem' }}>Enterprises</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>Delhi&apos;s premier real estate company for luxury rentals and sales.</p>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Properties</div>
            {PROPERTY_LINKS.map(([label, href]) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <Link href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</Link>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Company</div>
            {COMPANY_LINKS.map(([label, href]) => (
              <div key={label} style={{ marginBottom: '0.5rem' }}>
                <Link href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</Link>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Contact</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>Delhi, India<br />info@algebraenterprises.in</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>© 2026 Algebra Enterprises. All rights reserved.</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Premium Real Estate · Delhi</span>
        </div>
      </div>
    </footer>
  );
}
