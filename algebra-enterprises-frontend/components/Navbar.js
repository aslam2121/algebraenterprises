'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const THEME_STORAGE_KEY = 'ae-public-theme';
const DARK_THEME_LOGO_SRC = encodeURI('/logo/logo (white text).png');
const LIGHT_THEME_LOGO_SRC = encodeURI('/logo/logo (black text).png');

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

  const logoSrc = theme === 'light' ? LIGHT_THEME_LOGO_SRC : DARK_THEME_LOGO_SRC;

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
        <div className="container navbar-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minWidth: 0 }} className="navbar-logo-link">
            <Image
              src={logoSrc}
              alt="Algebra Enterprises"
              width={148}
              height={56}
              priority
              className="navbar-logo-image"
              style={{ width: 'auto', height: '56px', objectFit: 'contain' }}
            />
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
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexShrink: 0 }} className="navbar-actions">
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
              whiteSpace: 'nowrap',
            }}
              className="navbar-contact-link"
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--navy)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
            >
              <span className="contact-label-full">Contact Us</span>
              <span className="contact-label-short">Contact</span>
            </Link>

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
          .navbar-logo-image { height: 46px !important; width: auto !important; }
        }

        @media (max-width: 480px) {
          .navbar-shell { padding-left: 1rem !important; padding-right: 1rem !important; }
          .navbar-actions { gap: 0.55rem !important; }
          .navbar-logo-image { height: 40px !important; width: auto !important; }
          .navbar-contact-link { padding: 0.5rem 0.95rem !important; font-size: 0.78rem !important; }
        }

        @media (max-width: 400px) {
          .contact-label-full { display: none !important; }
          .contact-label-short { display: inline !important; }
          .navbar-contact-link { padding: 0.48rem 0.78rem !important; }
          .navbar-logo-image { height: 36px !important; width: auto !important; }
          .navbar-actions { gap: 0.45rem !important; }
        }

        @media (max-width: 360px) {
          .navbar-contact-link { display: none !important; }
          .navbar-logo-image { height: 34px !important; width: auto !important; }
        }

        .contact-label-short { display: none; }
      `}</style>
    </>
  );
}
