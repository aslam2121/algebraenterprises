'use client';
import PropertySearchBar from '@/components/PropertySearchBar';

export default function Hero() {
  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden',
    }}>

      {/* Background layers */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 40%, #0d1f35 70%, #150a0a 100%)',
      }} />

      {/* Geometric accent */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '55%', height: '120%',
        background: 'linear-gradient(135deg, rgba(192,57,43,0.08) 0%, rgba(201,168,76,0.05) 100%)',
        clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)',
        borderLeft: '1px solid rgba(201,168,76,0.1)',
      }} />

      {/* Gold orb */}
      <div style={{
        position: 'absolute', top: '20%', right: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Red orb */}
      <div style={{
        position: 'absolute', bottom: '10%', left: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Content */}
      <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: '6rem', paddingBottom: '4rem' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '100px',
          border: '1px solid rgba(201,168,76,0.3)',
          background: 'rgba(201,168,76,0.06)',
          marginBottom: '1.8rem',
          animation: 'fadeUp 0.6s ease forwards',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse-gold 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 500 }}>
            Premium Real Estate in Delhi
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
          fontWeight: 700, lineHeight: 1.05,
          marginBottom: '1.5rem',
          animation: 'fadeUp 0.7s 0.1s ease both',
          maxWidth: '780px',
        }}>
          Find Your <span style={{
            fontStyle: 'italic', color: 'transparent',
            WebkitTextStroke: '1px var(--gold)',
          }}>Perfect</span>
          <br />Home in Delhi
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '520px',
          lineHeight: 1.7, marginBottom: '3rem',
          animation: 'fadeUp 0.7s 0.2s ease both',
          fontWeight: 300,
        }}>
          Algebra Enterprises offers exclusive properties across Delhi&apos;s most prestigious neighbourhoods, from luxury apartments to premium farmhouses.
        </p>

        <PropertySearchBar />

        {/* Stats row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '2.5rem',
          marginTop: '3.5rem',
          animation: 'fadeUp 0.7s 0.4s ease both',
        }}>
          {[['265+', 'Total Properties'], ['15+', 'Premium Areas'], ['500+', 'Happy Clients']].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--gold)' }}>{num}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.1rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to bottom, transparent, var(--navy))',
        pointerEvents: 'none',
      }} />
    </section>
  );
}
