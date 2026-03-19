'use client';
import Link from 'next/link';

export function AreaLink({ area }) {
  return (
    <Link
      href={`/properties?area=${encodeURIComponent(area)}`}
      style={{
        textDecoration: 'none', fontSize: '0.78rem', color: 'var(--muted)',
        letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
        whiteSpace: 'nowrap', transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.target.style.color = '#c9a84c'}
      onMouseLeave={e => e.target.style.color = '#8a9bb5'}
    >{area}</Link>
  );
}

export function ViewAllLink({ total }) {
  return (
    <Link href="/properties" style={{
      textDecoration: 'none', padding: '0.6rem 1.6rem',
      border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px',
      color: '#c9a84c', fontSize: '0.85rem', fontWeight: 500,
      transition: 'all 0.2s', letterSpacing: '0.03em',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >View All {total}+ Properties →</Link>
  );
}

export function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      padding: '2rem', borderRadius: '16px',
      background: 'rgba(10,22,40,0.6)',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: 'border-color 0.3s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif', color: '#fff' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: '#8a9bb5', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}
