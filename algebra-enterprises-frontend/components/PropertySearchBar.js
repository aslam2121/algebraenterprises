'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  BEDROOM_FILTER_OPTIONS,
  getSearchQueryType,
  PROPERTY_SEARCH_NEIGHBOURHOODS,
} from '@/lib/property-search';

export default function PropertySearchBar({
  variant = 'hero',
  initialListingType = 'For Rent',
  initialArea = '',
  initialBedrooms = '',
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState(initialListingType);
  const [area, setArea] = useState(initialArea);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const isSidebar = variant === 'sidebar';

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('type', getSearchQueryType(listingType));

    if (area) {
      params.set('area', area);
    }

    if (bedrooms) {
      params.set('bedrooms', bedrooms);
    }

    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div
      style={{
        background: isSidebar ? 'var(--surface-panel)' : 'var(--surface-4)',
        border: isSidebar ? '1px solid var(--line-soft)' : '1px solid var(--line-gold)',
        borderRadius: '16px',
        padding: isSidebar ? '1rem' : '1.2rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: isSidebar ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: '0.8rem',
        alignItems: isSidebar ? 'stretch' : 'center',
        maxWidth: isSidebar ? '100%' : '840px',
        animation: isSidebar ? 'none' : 'fadeUp 0.7s 0.3s ease both',
        boxShadow: isSidebar ? 'none' : 'var(--shadow-floating)',
      }}
    >
      {isSidebar ? (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem', fontWeight: 700 }}>
            Quick Search
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Search similar homes by listing type, neighbourhood, and bedrooms.
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', background: 'var(--surface-5)', borderRadius: '10px', padding: '4px', width: isSidebar ? '100%' : 'auto' }}>
        {['For Rent', 'For Sale'].map((type) => (
          <button
            key={type}
            onClick={() => setListingType(type)}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              fontFamily: 'DM Sans, sans-serif',
              background: listingType === type ? 'var(--red)' : 'transparent',
              color: listingType === type ? 'var(--white)' : 'var(--text-muted)',
              boxShadow: listingType === type ? '0 4px 12px rgba(192,57,43,0.4)' : 'none',
              flex: isSidebar ? 1 : 'unset',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      <select
        value={area}
        onChange={(event) => setArea(event.target.value)}
        style={{
          flex: isSidebar ? 'unset' : 1,
          minWidth: isSidebar ? '100%' : '180px',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          color: area ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.88rem',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <option value="">All Neighbourhoods</option>
        {PROPERTY_SEARCH_NEIGHBOURHOODS.map((neighbourhood) => (
          <option key={neighbourhood} value={neighbourhood} style={{ background: 'var(--option-bg)' }}>
            {neighbourhood}
          </option>
        ))}
      </select>

      <select
        value={bedrooms}
        onChange={(event) => setBedrooms(event.target.value)}
        style={{
          minWidth: isSidebar ? '100%' : '170px',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          color: bedrooms ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.88rem',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {BEDROOM_FILTER_OPTIONS.map((option) => (
          <option key={option.value || 'any'} value={option.value} style={{ background: 'var(--option-bg)' }}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleSearch}
        style={{
          padding: isSidebar ? '0.75rem 1rem' : '0.65rem 1.8rem',
          borderRadius: '10px',
          border: 'none',
          background: 'linear-gradient(135deg, var(--red), var(--red-light))',
          color: 'var(--white)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.25s',
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: '0.02em',
          boxShadow: '0 6px 20px rgba(192,57,43,0.45)',
          whiteSpace: 'nowrap',
          width: isSidebar ? '100%' : 'auto',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'none';
        }}
      >
        Search Properties
      </button>
    </div>
  );
}
