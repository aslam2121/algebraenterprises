'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const THEME_STORAGE_KEY = 'ae-public-theme';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') {
      return 'dark';
    }

    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.4s ease',
        background: scrolled ? 'var(--surface-panel-strong)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line-gold)' : 'none',
        padding: scrolled ? '1rem 0' : '1.6rem 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--red) 0%, var(--red-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Playfair Display, serif', fontWeight: 700,
                fontSize: '1.1rem', color: 'var(--white)',
                boxShadow: '0 4px 15px rgba(192,57,43,0.4)',
              }}>A</div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  Algebra
                </div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 500 }}>
                  Enterprises
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="desktop-nav">
            {[['Properties', '/properties'], ['For Rent', '/properties?type=rent'], ['For Sale', '/properties?type=sale'], ['About', '/about']].map(([label, href]) => (
              <Link key={label} href={href} style={{
                textDecoration: 'none', color: 'var(--text-muted)',
                fontSize: '0.88rem', fontWeight: 500, letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid var(--line-gold)',
                background: 'var(--surface-4)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.25s',
              }}
            >
              <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
              <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <Link href="/contact" style={{
              textDecoration: 'none', padding: '0.55rem 1.4rem',
              border: '1px solid var(--gold)', borderRadius: '6px',
              color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.25s',
              letterSpacing: '0.03em',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--navy)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
            >Contact Us</Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none' }}
              className="hamburger"
            >
              <div style={{ width: 22, height: 2, background: 'var(--text-primary)', marginBottom: 5, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
              <div style={{ width: 22, height: 2, background: 'var(--text-primary)', marginBottom: 5, opacity: menuOpen ? 0 : 1 }} />
              <div style={{ width: 22, height: 2, background: 'var(--text-primary)', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 70, left: 0, right: 0, zIndex: 999,
          background: 'var(--surface-panel-strong)', backdropFilter: 'blur(12px)',
          padding: '2rem', borderBottom: '1px solid var(--line-gold)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {[['Properties', '/properties'], ['For Rent', '/properties?type=rent'], ['For Sale', '/properties?type=sale'], ['About', '/about'], ['Contact', '/contact']].map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '0.9rem 0', textDecoration: 'none',
              color: 'var(--text-primary)', fontSize: '1.1rem', fontFamily: 'Playfair Display, serif',
              borderBottom: '1px solid var(--line-soft)',
            }}>{label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
          .theme-toggle-label { display: none; }
        }
      `}</style>
    </>
  );
}
