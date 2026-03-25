'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPropertyNeighbourhood, getStrapiMediaUrl } from '@/lib/strapi';

function formatDisplayDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

export default function PropertyCard({ property }) {
  const [hovered, setHovered] = useState(false);
  const neighbourhood = getPropertyNeighbourhood(property);
  const publishedDate = formatDisplayDate(property.Published_Date);

  const img = property.Images?.length > 0
    ? getStrapiMediaUrl(property.Images[0].url)
    : null;

  const formatPrice = (price) => {
    if (!price) return 'Price on Request';
    if (price >= 100) return `₹${price} L`;
    return `₹${price}L`;
  };

  const statusColor = {
    'Live': '#22c55e',
    'Rented Out': '#f59e0b',
    'Sold': '#ef4444',
  };

  return (
    <Link href={`/properties/${property.Property_Code}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--surface-2)' : 'var(--surface-1)',
          border: hovered ? '1px solid var(--line-gold)' : '1px solid var(--line-soft)',
          borderRadius: '16px', overflow: 'hidden',
          transition: 'all 0.35s ease',
          transform: hovered ? 'translateY(-6px)' : 'none',
          boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: 'var(--surface-3)' }}>
          {img ? (
            <Image
              src={img}
              alt={property.Title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized
              style={{
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.07)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--surface-1), var(--surface-3))',
              gap: '0.5rem',
            }}>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>🏠</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No image available</span>
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', display: 'flex', gap: '0.4rem' }}>
            <span style={{
              padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.72rem',
              fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              background: property.Listing_Type === 'For Rent' ? 'var(--surface-panel-strong)' : 'rgba(192,57,43,0.9)',
              color: property.Listing_Type === 'For Rent' ? 'var(--gold)' : 'var(--white)',
              border: property.Listing_Type === 'For Rent' ? '1px solid var(--gold)' : 'none',
              backdropFilter: 'blur(4px)',
            }}>{property.Listing_Type}</span>
          </div>

          {property.Featured_Property && (
            <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem' }}>
              <span style={{
                padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.7rem',
                fontWeight: 600, background: 'rgba(201,168,76,0.9)', color: 'var(--page-bg-strong)',
                letterSpacing: '0.04em',
              }}>★ Featured</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1.2rem' }}>
          {/* Area */}
          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '0.4rem' }}>
            📍 {neighbourhood || 'Delhi'}
          </div>
          {publishedDate && (
            <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              🗓 Listed {publishedDate}
            </div>
          )}

          {/* Title */}
          <h3 style={{
            fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
            marginBottom: '0.8rem', lineHeight: 1.3,
            fontFamily: 'Playfair Display, serif',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{property.Title}</h3>

          {/* Details row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {property.Bedrooms && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                🛏 {property.Bedrooms} Bed
              </span>
            )}
            {property.Bathrooms && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                🚿 {property.Bathrooms} Bath
              </span>
            )}
            {property.Area_Sqm && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                📐 {property.Area_Sqm} sqm
              </span>
            )}
          </div>

          {/* Price + Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line-soft)', paddingTop: '0.9rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
              {formatPrice(property.Price)}
              {property.Listing_Type === 'For Rent' && property.Price && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'DM Sans', fontWeight: 400 }}>/month</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor[property.Property_Status] || '#22c55e' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{property.Property_Status}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
