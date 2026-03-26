'use client';
import { Suspense, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';
import { PROPERTY_NEIGHBOURHOOD_FILTER_KEY, STRAPI_BASE_URL } from '@/lib/strapi';
import {
  BEDROOM_FILTER_OPTIONS,
  getListingTypeFromQueryValue,
} from '@/lib/property-search';

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

function getListingTypeParamValue(listingType) {
  if (listingType === 'For Sale') {
    return 'sale';
  }

  if (listingType === 'For Rent') {
    return 'rent';
  }

  return '';
}

function getStateFromSearchParams(searchParams) {
  return {
    listingType: getListingTypeFromQueryValue(searchParams.get('type')),
    area: searchParams.get('area') || 'All Areas',
    propertyType: searchParams.get('propertyType') || 'All Types',
    bedrooms: searchParams.get('bedrooms') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    propertyCode: searchParams.get('code') || '',
    sortBy: searchParams.get('sort') || 'newest',
  };
}

function buildBedroomFilterQuery(bedrooms) {
  if (!bedrooms) {
    return '';
  }

  if (bedrooms === '10+') {
    return '&filters[Bedrooms][$gte]=10';
  }

  return `&filters[Bedrooms][$eq]=${encodeURIComponent(bedrooms)}`;
}

function PropertiesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const initialState = getStateFromSearchParams(new URLSearchParams(queryString));

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersReady, setFiltersReady] = useState(false);
  const [appliedQueryString, setAppliedQueryString] = useState(queryString);

  // Filter state — initialize from URL params
  const [listingType, setListingType] = useState(initialState.listingType);
  const [area, setArea] = useState(initialState.area);
  const [propertyType, setPropertyType] = useState(initialState.propertyType);
  const [bedrooms, setBedrooms] = useState(initialState.bedrooms);
  const [minPrice, setMinPrice] = useState(initialState.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialState.maxPrice);
  const [propertyCode, setPropertyCode] = useState(initialState.propertyCode);
  const [sortBy, setSortBy] = useState(initialState.sortBy);

  const PAGE_SIZE = 12;

  useEffect(() => {
    const nextState = getStateFromSearchParams(new URLSearchParams(queryString));

    setListingType((currentValue) => currentValue === nextState.listingType ? currentValue : nextState.listingType);
    setArea((currentValue) => currentValue === nextState.area ? currentValue : nextState.area);
    setPropertyType((currentValue) => currentValue === nextState.propertyType ? currentValue : nextState.propertyType);
    setBedrooms((currentValue) => currentValue === nextState.bedrooms ? currentValue : nextState.bedrooms);
    setMinPrice((currentValue) => currentValue === nextState.minPrice ? currentValue : nextState.minPrice);
    setMaxPrice((currentValue) => currentValue === nextState.maxPrice ? currentValue : nextState.maxPrice);
    setPropertyCode((currentValue) => currentValue === nextState.propertyCode ? currentValue : nextState.propertyCode);
    setSortBy((currentValue) => currentValue === nextState.sortBy ? currentValue : nextState.sortBy);
    setPage((currentPage) => currentPage === 1 ? currentPage : 1);
    setAppliedQueryString(queryString);
    setFiltersReady(true);
  }, [queryString]);

  useEffect(() => {
    if (!filtersReady || appliedQueryString !== queryString) {
      return;
    }

    const params = new URLSearchParams();
    const typeValue = getListingTypeParamValue(listingType);

    if (typeValue) {
      params.set('type', typeValue);
    }
    if (area !== 'All Areas') {
      params.set('area', area);
    }
    if (propertyType !== 'All Types') {
      params.set('propertyType', propertyType);
    }
    if (bedrooms) {
      params.set('bedrooms', bedrooms);
    }
    if (minPrice.trim()) {
      params.set('minPrice', minPrice.trim());
    }
    if (maxPrice.trim()) {
      params.set('maxPrice', maxPrice.trim());
    }
    if (propertyCode.trim()) {
      params.set('code', propertyCode.trim());
    }
    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
    }

    const nextQueryString = params.toString();

    if (nextQueryString !== queryString) {
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, { scroll: false });
    }
  }, [filtersReady, appliedQueryString, listingType, area, propertyType, bedrooms, minPrice, maxPrice, propertyCode, sortBy, queryString, pathname, router]);

  useEffect(() => {
    let ignore = false;

    async function loadProperties() {
      setLoading(true);

      try {
        let url = `${STRAPI_BASE_URL}/api/properties?populate=Images&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}&filters[Property_Status][$eq]=Live`;

        if (listingType !== 'All') {
          url += `&filters[Listing_Type][$eq]=${encodeURIComponent(listingType)}`;
        }
        if (area !== 'All Areas') {
          url += `&filters[${PROPERTY_NEIGHBOURHOOD_FILTER_KEY}][$contains]=${encodeURIComponent(area)}`;
        }
        if (propertyType !== 'All Types') {
          url += `&filters[Property_Type][$eq]=${encodeURIComponent(propertyType)}`;
        }
        url += buildBedroomFilterQuery(bedrooms);
        if (minPrice.trim()) {
          url += `&filters[Price][$gte]=${encodeURIComponent(minPrice.trim())}`;
        }
        if (maxPrice.trim()) {
          url += `&filters[Price][$lte]=${encodeURIComponent(maxPrice.trim())}`;
        }
        if (propertyCode.trim()) {
          url += `&filters[Property_Code][$containsi]=${encodeURIComponent(propertyCode.trim())}`;
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
  }, [listingType, area, propertyType, bedrooms, minPrice, maxPrice, propertyCode, sortBy, page]);

  const handleFilter = (key, value) => {
    setPage(1);
    if (key === 'listingType') setListingType(value);
    if (key === 'area') setArea(value);
    if (key === 'propertyType') setPropertyType(value);
    if (key === 'bedrooms') setBedrooms(value);
    if (key === 'minPrice') setMinPrice(value);
    if (key === 'maxPrice') setMaxPrice(value);
    if (key === 'propertyCode') setPropertyCode(value);
    if (key === 'sortBy') setSortBy(value);
  };

  function resetFilters() {
    setListingType('All');
    setArea('All Areas');
    setPropertyType('All Types');
    setBedrooms('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyCode('');
    setSortBy('newest');
    setPage(1);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', paddingTop: '80px' }}>

      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(180deg, var(--surface-1) 0%, transparent 100%)',
        padding: '3rem 0 2rem', borderBottom: '1px solid var(--line-gold)',
      }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span style={{ color: 'var(--gold)' }}>Properties</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', marginBottom: '0.5rem' }}>
            {listingType === 'All' ? 'All Properties' : `Properties ${listingType}`}
            {area !== 'All Areas' ? ` in ${area}` : ' in Delhi'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {loading ? 'Searching...' : `${total} properties found`}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem' }}>

        {/* Filter Bar */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--line-gold)',
          borderRadius: '16px', padding: '1.2rem 1.5rem',
          marginBottom: '2.5rem',
          backdropFilter: 'blur(10px)',
        }}>

          {/* Listing Type */}
          <div style={{ display: 'flex', background: 'var(--surface-5)', borderRadius: '10px', padding: '3px', marginBottom: '1rem', flexWrap: 'wrap', width: 'fit-content', maxWidth: '100%' }}>
            {['All', 'For Rent', 'For Sale'].map(t => (
              <button key={t} onClick={() => handleFilter('listingType', t)} style={{
                padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500,
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                background: listingType === t ? (t === 'For Sale' ? '#c0392b' : t === 'For Rent' ? '#c9a84c' : 'var(--page-bg-softer)') : 'transparent',
                color: listingType === t ? (t === 'For Rent' ? 'var(--page-bg-strong)' : 'var(--white)') : 'var(--text-muted)',
                boxShadow: listingType === t ? '0 3px 10px rgba(0,0,0,0.3)' : 'none',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <select value={area} onChange={e => handleFilter('area', e.target.value)} style={{
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: '10px', padding: '0.5rem 1rem',
              color: area !== 'All Areas' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', minWidth: '0',
            }}>
              {AREAS.map(a => <option key={a} value={a} style={{ background: 'var(--option-bg)' }}>{a}</option>)}
            </select>

            <select value={propertyType} onChange={e => handleFilter('propertyType', e.target.value)} style={{
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: '10px', padding: '0.5rem 1rem',
              color: propertyType !== 'All Types' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', minWidth: '0',
            }}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t} style={{ background: 'var(--option-bg)' }}>{t}</option>)}
            </select>

            <select value={bedrooms} onChange={e => handleFilter('bedrooms', e.target.value)} style={{
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: '10px', padding: '0.5rem 1rem',
              color: bedrooms ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', minWidth: '0',
            }}>
              {BEDROOM_FILTER_OPTIONS.map(option => <option key={option.value || 'any'} value={option.value} style={{ background: 'var(--option-bg)' }}>{option.label}</option>)}
            </select>

            <input
              value={minPrice}
              onChange={e => handleFilter('minPrice', e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="Min Price (L)"
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                borderRadius: '10px', padding: '0.5rem 1rem',
                color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', minWidth: '0',
              }}
            />

            <input
              value={maxPrice}
              onChange={e => handleFilter('maxPrice', e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="Max Price (L)"
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                borderRadius: '10px', padding: '0.5rem 1rem',
                color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', minWidth: '0',
              }}
            />

            <input
              value={propertyCode}
              onChange={e => handleFilter('propertyCode', e.target.value)}
              placeholder="Property Code"
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                borderRadius: '10px', padding: '0.5rem 1rem',
                color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', minWidth: '0',
              }}
            />

            <select value={sortBy} onChange={e => handleFilter('sortBy', e.target.value)} style={{
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: '10px', padding: '0.5rem 1rem',
              color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', minWidth: '0',
            }}>
              <option value="newest" style={{ background: 'var(--option-bg)' }}>Newest First</option>
              <option value="price_asc" style={{ background: 'var(--option-bg)' }}>Price: Low to High</option>
              <option value="price_desc" style={{ background: 'var(--option-bg)' }}>Price: High to Low</option>
            </select>
          </div>

          {(listingType !== 'All'
            || area !== 'All Areas'
            || propertyType !== 'All Types'
            || bedrooms
            || minPrice.trim()
            || maxPrice.trim()
            || propertyCode.trim()
            || sortBy !== 'newest') && (
            <button onClick={resetFilters} style={{
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: '8px', padding: '0.45rem 0.9rem',
              color: 'var(--red-light)', fontSize: '0.8rem', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              marginTop: '1rem',
            }}>✕ Clear</button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: '380px', borderRadius: '16px',
                background: 'linear-gradient(90deg, var(--surface-1) 25%, var(--surface-3) 50%, var(--surface-1) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.5rem' }}>No properties found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try adjusting your filters</p>
            <button onClick={resetFilters} style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid var(--gold)',
              background: 'transparent', color: 'var(--gold)', cursor: 'pointer',
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
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--line-strong)',
                    background: 'transparent', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>← Prev</button>

                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo(0, 0); }} style={{
                      width: 38, height: 38, borderRadius: '8px', border: 'none',
                      background: page === p ? 'var(--red)' : 'var(--surface-5)',
                      color: page === p ? 'var(--white)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                      boxShadow: page === p ? '0 4px 12px rgba(192,57,43,0.4)' : 'none',
                    }}>{p}</button>
                  );
                })}

                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--line-strong)',
                    background: 'transparent', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
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
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', paddingTop: '80px' }}>
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading properties...</p>
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
