'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';
import { PROPERTY_NEIGHBOURHOOD_FILTER_KEY } from '@/lib/strapi';

const AREAS = [
  'All Areas', 'Vasant Vihar', 'Defence Colony', 'Anand Niketan',
  'Safdarjung Enclave', 'Hauz Khas', 'Chanakyapuri', 'Golf Links',
  'Jor Bagh', 'Vasant Kunj Farms', 'Westend', 'Shanti Niketan',
  'Nizamuddin East', 'SDA', 'Green Park Main', 'Green Park Extension',
  'Panchsheel Park', 'Pansheel Enclave', 'Jangpura Extension',
  'Lajpat Nagar', 'Sundar Nagar', 'Neeti Bagh', 'Gulmohar Park',
  'Ghitorni', 'Dera Mandi', 'Chattarpur', 'Satbari', 'Pushpanjali',
  'Bijwasan', 'Kapashera', 'Gadaipur',
];

const PROPERTY_TYPES = [
  'All Types',
  'Apartment',
  'Entire Building',
  'Independent House',
  'Duplex',
  'Service Apartment',
  'Farm House',
];

function getListingTypeFromParams(searchParams) {
  return searchParams.get('type') === 'sale'
    ? 'For Sale'
    : searchParams.get('type') === 'rent'
      ? 'For Rent'
      : 'All';
}

function PropertiesPageContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filter state — initialize from URL params
  const [listingType, setListingType] = useState(getListingTypeFromParams(searchParams));
  const [area, setArea] = useState(searchParams.get('area') || 'All Areas');
  const [propertyType, setPropertyType] = useState('All Types');
  const [sortBy, setSortBy] = useState('newest');

  const PAGE_SIZE = 12;

  useEffect(() => {
    setListingType(getListingTypeFromParams(searchParams));
    setArea(searchParams.get('area') || 'All Areas');
    setPage(1);
  }, [queryString, searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadProperties() {
      setLoading(true);

      try {
        let url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/properties?populate=Images&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}&filters[Property_Status][$eq]=Live`;

        if (listingType !== 'All') {
          url += `&filters[Listing_Type][$eq]=${encodeURIComponent(listingType)}`;
        }
        if (area !== 'All Areas') {
          url += `&filters[${PROPERTY_NEIGHBOURHOOD_FILTER_KEY}][$contains]=${encodeURIComponent(area)}`;
        }
        if (propertyType !== 'All Types') {
          url += `&filters[Property_Type][$eq]=${encodeURIComponent(propertyType)}`;
        }
        if (sortBy === 'newest') url += '&sort=createdAt:desc';
        if (sortBy === 'price_asc') url += '&sort=Price:asc';
        if (sortBy === 'price_desc') url += '&sort=Price:desc';

        const res = await fetch(url);
        const data = await res.json();

        if (ignore) {
          return;
        }

        setProperties(data.data || []);
        setTotal(data.meta?.pagination?.total || 0);
      } catch (e) {
        if (!ignore) {
          console.error(e);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      ignore = true;
    };
  }, [listingType, area, propertyType, sortBy, page]);

  const handleFilter = (key, value) => {
    setPage(1);
    if (key === 'listingType') setListingType(value);
    if (key === 'area') setArea(value);
    if (key === 'propertyType') setPropertyType(value);
    if (key === 'sortBy') setSortBy(value);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px' }}>

      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(17,34,64,0.8) 0%, transparent 100%)',
        padding: '3rem 0 2rem', borderBottom: '1px solid rgba(201,168,76,0.1)',
      }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.78rem', color: '#8a9bb5', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#8a9bb5', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span style={{ color: '#c9a84c' }}>Properties</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', marginBottom: '0.5rem' }}>
            {listingType === 'All' ? 'All Properties' : `Properties ${listingType}`}
            {area !== 'All Areas' ? ` in ${area}` : ' in Delhi'}
          </h1>
          <p style={{ color: '#8a9bb5', fontSize: '0.9rem' }}>
            {loading ? 'Searching...' : `${total} properties found`}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem' }}>

        {/* Filter Bar */}
        <div style={{
          background: 'rgba(17,34,64,0.7)', border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '16px', padding: '1.2rem 1.5rem',
          marginBottom: '2.5rem', display: 'flex',
          flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
          backdropFilter: 'blur(10px)',
        }}>

          {/* Listing Type */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px' }}>
            {['All', 'For Rent', 'For Sale'].map(t => (
              <button key={t} onClick={() => handleFilter('listingType', t)} style={{
                padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                background: listingType === t ? (t === 'For Sale' ? '#c0392b' : t === 'For Rent' ? '#c9a84c' : '#1a3a5c') : 'transparent',
                color: listingType === t ? '#fff' : '#8a9bb5',
                boxShadow: listingType === t ? '0 3px 10px rgba(0,0,0,0.3)' : 'none',
              }}>{t}</button>
            ))}
          </div>

          {/* Area Select */}
          <select value={area} onChange={e => handleFilter('area', e.target.value)} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '0.5rem 1rem',
            color: area !== 'All Areas' ? '#fff' : '#8a9bb5',
            fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', minWidth: '160px',
          }}>
            {AREAS.map(a => <option key={a} value={a} style={{ background: '#0a1628' }}>{a}</option>)}
          </select>

          {/* Property Type */}
          <select value={propertyType} onChange={e => handleFilter('propertyType', e.target.value)} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '0.5rem 1rem',
            color: propertyType !== 'All Types' ? '#fff' : '#8a9bb5',
            fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', minWidth: '140px',
          }}>
            {PROPERTY_TYPES.map(t => <option key={t} value={t} style={{ background: '#0a1628' }}>{t}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => handleFilter('sortBy', e.target.value)} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '0.5rem 1rem',
            color: '#fff', fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', marginLeft: 'auto',
          }}>
            <option value="newest" style={{ background: '#0a1628' }}>Newest First</option>
            <option value="price_asc" style={{ background: '#0a1628' }}>Price: Low to High</option>
            <option value="price_desc" style={{ background: '#0a1628' }}>Price: High to Low</option>
          </select>

          {/* Clear filters */}
          {(listingType !== 'All' || area !== 'All Areas' || propertyType !== 'All Types') && (
            <button onClick={() => { setListingType('All'); setArea('All Areas'); setPropertyType('All Types'); setPage(1); }} style={{
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: '8px', padding: '0.45rem 0.9rem',
              color: '#e74c3c', fontSize: '0.8rem', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>✕ Clear</button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: '380px', borderRadius: '16px',
                background: 'linear-gradient(90deg, rgba(17,34,64,0.8) 25%, rgba(26,58,92,0.4) 50%, rgba(17,34,64,0.8) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.5rem' }}>No properties found</h3>
            <p style={{ color: '#8a9bb5', marginBottom: '1.5rem' }}>Try adjusting your filters</p>
            <button onClick={() => { setListingType('All'); setArea('All Areas'); setPropertyType('All Types'); }} style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #c9a84c',
              background: 'transparent', color: '#c9a84c', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>Clear All Filters</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: page === 1 ? '#8a9bb5' : '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>← Prev</button>

                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo(0, 0); }} style={{
                      width: 38, height: 38, borderRadius: '8px', border: 'none',
                      background: page === p ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                      color: page === p ? '#fff' : '#8a9bb5',
                      cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                      boxShadow: page === p ? '0 4px 12px rgba(192,57,43,0.4)' : 'none',
                    }}>{p}</button>
                  );
                })}

                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: page === totalPages ? '#8a9bb5' : '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

function PropertiesPageFallback() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px' }}>
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#8a9bb5', fontSize: '0.95rem' }}>Loading properties...</p>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesPageFallback />}>
      <PropertiesPageContent />
    </Suspense>
  );
}
