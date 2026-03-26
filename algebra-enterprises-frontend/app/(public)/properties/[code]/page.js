'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import PropertyCard from '@/components/PropertyCard';
import PropertySearchBar from '@/components/PropertySearchBar';
import { getPropertyNeighbourhood, getStrapiMediaUrl, STRAPI_BASE_URL } from '@/lib/strapi';

const SIMILAR_PRICE_DELTA = 0.5;
const SIMILAR_PRICE_FALLBACK_DELTA = 1.5;
const SIMILAR_PROPERTIES_LIMIT = 6;

function normalizeListValue(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim());
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return [];
  }

  if (trimmedValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmedValue);
      return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === 'string' && item.trim())
        : [];
    } catch {
      return [];
    }
  }

  return trimmedValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasDisplayValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

function getNumericPrice(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

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
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

function formatShortPrice(value, listingType) {
  const numericValue = getNumericPrice(value);

  if (numericValue === null) {
    return null;
  }

  return `₹${numericValue}L${listingType === 'For Rent' ? '/month' : ''}`;
}

function buildSimilarPropertiesUrl(property, { priceDelta, pageSize = 18 } = {}) {
  const params = new URLSearchParams();
  params.set('populate', 'Images');
  params.set('pagination[pageSize]', String(pageSize));
  params.set('filters[Property_Status][$eq]', 'Live');
  params.set('filters[Property_Type][$eq]', property.Property_Type);
  params.set('filters[Property_Code][$ne]', property.Property_Code);
  params.set('sort[0]', 'Price:asc');

  if (property.Listing_Type) {
    params.set('filters[Listing_Type][$eq]', property.Listing_Type);
  }

  const priceValue = getNumericPrice(property.Price);

  if (priceValue !== null && priceDelta !== null) {
    params.set('filters[Price][$gte]', String(Math.max(priceValue - priceDelta, 0)));
    params.set('filters[Price][$lte]', String(priceValue + priceDelta));
  }

  return `${STRAPI_BASE_URL}/api/properties?${params.toString()}`;
}

function sortSimilarProperties(properties, targetPrice) {
  return [...properties].sort((left, right) => {
    if (targetPrice === null) {
      return 0;
    }

    const leftDistance = Math.abs((getNumericPrice(left.Price) ?? Number.POSITIVE_INFINITY) - targetPrice);
    const rightDistance = Math.abs((getNumericPrice(right.Price) ?? Number.POSITIVE_INFINITY) - targetPrice);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return (getNumericPrice(left.Price) ?? Number.POSITIVE_INFINITY)
      - (getNumericPrice(right.Price) ?? Number.POSITIVE_INFINITY);
  });
}

async function fetchSimilarProperties(property) {
  if (!property?.Property_Type || !property?.Property_Code) {
    return [];
  }

  const requests = [
    fetch(buildSimilarPropertiesUrl(property, { priceDelta: SIMILAR_PRICE_DELTA })),
    fetch(buildSimilarPropertiesUrl(property, { priceDelta: SIMILAR_PRICE_FALLBACK_DELTA })),
  ];

  const settledResponses = await Promise.allSettled(requests);
  const mergedProperties = [];
  const seenCodes = new Set([property.Property_Code]);

  for (const settledResponse of settledResponses) {
    if (settledResponse.status !== 'fulfilled' || !settledResponse.value.ok) {
      continue;
    }

    const payload = await settledResponse.value.json();
    const records = Array.isArray(payload?.data) ? payload.data : [];

    for (const record of records) {
      const propertyCode = record?.Property_Code;

      if (!propertyCode || seenCodes.has(propertyCode)) {
        continue;
      }

      seenCodes.add(propertyCode);
      mergedProperties.push(record);
    }
  }

  const targetPrice = getNumericPrice(property.Price);

  return sortSimilarProperties(mergedProperties, targetPrice).slice(0, SIMILAR_PROPERTIES_LIMIT);
}

export default function PropertyDetailPage() {
  const { code } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProperty() {
      setLoading(true);
      setSimilarLoading(false);
      setSimilarProperties([]);

      try {
        const res = await fetch(
          `${STRAPI_BASE_URL}/api/properties?filters[Property_Code][$eq]=${code}&populate=Images`
        );
        const data = await res.json();
        const nextProperty = data.data?.[0] || null;

        if (!cancelled) {
          setProperty(nextProperty);
          setActiveImage(0);
        }

        if (nextProperty?.Property_Type) {
          if (!cancelled) {
            setSimilarLoading(true);
          }

          try {
            const nextSimilarProperties = await fetchSimilarProperties(nextProperty);

            if (!cancelled) {
              setSimilarProperties(nextSimilarProperties);
            }
          } catch (similarError) {
            console.error(similarError);

            if (!cancelled) {
              setSimilarProperties([]);
            }
          }
        } else if (!cancelled) {
          setSimilarProperties([]);
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          setProperty(null);
          setSimilarProperties([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSimilarLoading(false);
        }
      }
    }
    fetchProperty();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const formatPrice = (price, type) => {
    if (!price) return 'Price on Request';
    return `₹${price}L${type === 'For Rent' ? '/month' : ''}`;
  };

  const getDescription = (desc) => {
    if (!desc) return null;
    if (typeof desc === 'string') return desc;
    if (Array.isArray(desc)) {
      return desc.map(block =>
        block.children?.map(child => child.text || '').join('') || ''
      ).join('\n');
    }
    return null;
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            Name: enquiryForm.name,
            Phone: enquiryForm.phone,
            Email: enquiryForm.email,
            Message: enquiryForm.message,
            Property_Code: property.Property_Code,
            Property_Title: property.Title,
            Client_Status: 'New',
          }
        })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } catch (e) {
      setSubmitError('Could not connect. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(201,168,76,0.2)', borderTop: '3px solid #c9a84c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Loading property...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!property) return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 1.5rem 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏚</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Property Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>This property may have been removed.</p>
        <Link href="/properties" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#c0392b', color: 'var(--white)', textDecoration: 'none', fontSize: '0.9rem' }}>Browse All Properties</Link>
      </div>
    </div>
  );

  const images = property.Images || [];
  const description = getDescription(property.Description);
  const statusColor = { 'Live': '#22c55e', 'Rented Out': '#f59e0b', 'Sold': '#ef4444' };
  const neighbourhood = getPropertyNeighbourhood(property);
  const features = normalizeListValue(property.Features);
  const resolvedImages = images.map((image) => ({
    ...image,
    resolvedUrl: getStrapiMediaUrl(image.url),
  }));
  const propertyPrice = getNumericPrice(property.Price);
  const publishedDate = formatDisplayDate(property.Published_Date);
  const priceRangeStart = propertyPrice !== null ? Math.max(propertyPrice - SIMILAR_PRICE_DELTA, 0) : null;
  const priceRangeEnd = propertyPrice !== null ? propertyPrice + SIMILAR_PRICE_DELTA : null;
  const browseListingsHref = property.Listing_Type === 'For Rent'
    ? '/properties?type=rent'
    : property.Listing_Type === 'For Sale'
      ? '/properties?type=sale'
      : '/properties';
  const similarSectionSummary = propertyPrice !== null
    ? `${property.Property_Type} properties around ${formatShortPrice(property.Price, property.Listing_Type)}. Nearest matches from ${formatShortPrice(priceRangeStart, property.Listing_Type)} to ${formatShortPrice(priceRangeEnd, property.Listing_Type)} are prioritized.`
    : `More ${property.Property_Type?.toLowerCase()} properties with the same listing type.`;
  const detailItems = [
    { icon: '💰', label: 'Price', value: formatPrice(property.Price, property.Listing_Type) },
    { icon: '🏠', label: 'Property Type', value: property.Property_Type },
    { icon: '🏢', label: 'Available Floors', value: property.Available_Floors },
    { icon: '🛏', label: 'Bedrooms', value: property.Bedrooms ? `${property.Bedrooms} BHK` : null },
    { icon: '🚿', label: 'Bathrooms', value: property.Bathrooms },
    { icon: '📐', label: 'Area (sqm)', value: property.Area_Sqm ? `${property.Area_Sqm} sqm` : null },
    { icon: '🏗', label: 'Property Age', value: property.Property_Age ? `${property.Property_Age} yrs` : null },
    { icon: '🗓', label: 'Published Date', value: publishedDate },
    { icon: '🚗', label: 'Parking', value: property.Parking },
    { icon: '🧭', label: 'Direction', value: property.Directions },
    { icon: '🏷', label: 'Code', value: property.Property_Code },
  ].filter((item) => hasDisplayValue(item.value));

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }

        .pd-page {
          min-height: 100vh;
          background: var(--page-bg);
          padding-top: 80px;
          font-family: DM Sans, sans-serif;
          overflow-x: hidden;
        }
        .pd-wrap {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }
        .pd-breadcrumb {
          border-bottom: 1px solid var(--line-soft);
          padding: 0.9rem 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .pd-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .pd-breadcrumb span.active { color: var(--gold); }

        /* Two column layout on desktop */
        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
          padding: 2rem 0 3rem;
          align-items: start;
        }
        .pd-sidebar-desktop { position: sticky; top: 100px; }
        .pd-sidebar-mobile  { display: none; }

        /* Main image */
        .pd-main-img {
          width: 100%;
          height: 420px;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          background: var(--surface-2);
          margin-bottom: 0.7rem;
        }
        .pd-main-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* Thumbnails */
        .pd-thumbs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.4rem;
          margin-bottom: 1.5rem;
        }
        .pd-thumb {
          width: 80px;
          height: 60px;
          border-radius: 7px;
          object-fit: cover;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .pd-thumb.active { border-color: #c9a84c; opacity: 1; }
        .pd-thumb:not(.active) { opacity: 0.55; }

        /* Details grid */
        .pd-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        /* Cards */
        .pd-card {
          background: var(--surface-2);
          border: 1px solid var(--line-soft);
          border-radius: 14px;
          padding: 1.3rem;
          margin-bottom: 1.2rem;
        }
        .pd-card-label {
          font-size: 0.7rem;
          color: var(--gold);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .pd-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 0.7rem;
        }
        .pd-feature-chip {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.8rem 0.95rem;
          border-radius: 12px;
          background:
            linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04)),
            var(--surface-3);
          border: 1px solid var(--line-gold);
          box-shadow: inset 0 1px 0 var(--line-soft);
        }
        .pd-feature-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          flex-shrink: 0;
          background: radial-gradient(circle at 30% 30%, #f7e7b6, #c9a84c 70%);
          box-shadow: 0 0 0 4px rgba(201,168,76,0.08);
        }
        .pd-feature-text {
          color: var(--text-gold-soft);
          font-size: 0.86rem;
          line-height: 1.35;
          font-weight: 500;
        }
        .pd-similar-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .pd-mobile-search-toggle {
          display: none;
        }

        /* Sidebar card */
        .pd-price-card {
          background: var(--surface-panel);
          border: 1px solid var(--line-gold);
          border-radius: 16px;
          padding: 1.4rem;
          margin-bottom: 1rem;
        }
        .pd-enquiry-card {
          background: var(--surface-panel);
          border: 1px solid var(--line-soft);
          border-radius: 16px;
          padding: 1.4rem;
        }

        /* Inputs */
        .pd-input {
          width: 100%;
          padding: 0.65rem 0.9rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.88rem;
          outline: none;
          font-family: DM Sans, sans-serif;
          display: block;
          box-sizing: border-box;
        }
        .pd-input::placeholder { color: var(--input-placeholder); }
        .pd-input:focus { border-color: rgba(201,168,76,0.5); }

        .pd-btn-red {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.75rem; border-radius: 10px; margin-bottom: 0.6rem;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          color: var(--white); text-decoration: none; font-weight: 600; font-size: 0.88rem;
          box-shadow: 0 5px 18px rgba(192,57,43,0.4);
          border: none; cursor: pointer; font-family: DM Sans, sans-serif;
          box-sizing: border-box;
        }
        .pd-btn-wa {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.75rem; border-radius: 10px;
          background: rgba(37,211,102,0.12); border: 1px solid rgba(37,211,102,0.3);
          color: #25d366; text-decoration: none; font-weight: 600; font-size: 0.88rem;
          box-sizing: border-box;
        }

        /* ── MOBILE ── */
        @media (max-width: 860px) {
          .pd-layout {
            grid-template-columns: 1fr;
            gap: 1.2rem;
            padding: 1.2rem 0 2rem;
          }
          .pd-sidebar-desktop { display: none !important; }
          .pd-sidebar-mobile  { display: block !important; margin-bottom: 1.2rem; }
          .pd-mobile-search-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            width: 100%;
            margin-bottom: 0.9rem;
            padding: 0.8rem 1rem;
            border-radius: 12px;
            border: 1px solid var(--line-gold);
            background: var(--surface-2);
            color: var(--gold);
            font-size: 0.84rem;
            font-weight: 600;
            font-family: DM Sans, sans-serif;
          }
          .pd-main-img { height: 240px; }
          .pd-thumb { width: 60px; height: 46px; }
          .pd-details-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pd-similar-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .pd-wrap { padding: 0 1rem; }
        }

        @media (max-width: 480px) {
          .pd-main-img { height: 200px; }
          .pd-details-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pd-similar-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pd-page">

        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <div className="pd-wrap">
            <span>
              <Link href="/">Home</Link>
              {' › '}
              <Link href="/properties">Properties</Link>
              {' › '}
              <span className="active">{neighbourhood || property.Title}</span>
            </span>
          </div>
        </div>

        <div className="pd-wrap">
          <div className="pd-layout">

            {/* ── LEFT ── */}
            <div style={{ minWidth: 0 }}>

              {/* Title */}
              <div style={{ marginBottom: '1.3rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span style={{ padding: '0.28rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: property.Listing_Type === 'For Rent' ? 'rgba(201,168,76,0.15)' : 'rgba(192,57,43,0.9)', color: property.Listing_Type === 'For Rent' ? 'var(--gold)' : 'var(--white)', border: property.Listing_Type === 'For Rent' ? '1px solid rgba(201,168,76,0.4)' : 'none' }}>
                    {property.Listing_Type}
                  </span>
                  {property.Property_Type && (
                    <span style={{ padding: '0.28rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', background: 'var(--surface-5)', color: 'var(--text-muted)', border: '1px solid var(--line-strong)' }}>{property.Property_Type}</span>
                  )}
                  <span style={{ padding: '0.28rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--surface-5)', border: '1px solid var(--line-strong)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor[property.Property_Status] || '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>{property.Property_Status}</span>
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', lineHeight: 1.25, color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif', marginBottom: '0.4rem', wordBreak: 'break-word' }}>
                  {property.Title}
                </h1>
                {neighbourhood && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>📍 {neighbourhood}, Delhi</p>
                )}
              </div>

              {/* Image Gallery */}
              {resolvedImages.length > 0 ? (
                <>
                  <div className="pd-main-img">
                    <Image
                      src={resolvedImages[activeImage]?.resolvedUrl}
                      alt={property.Title}
                      fill
                      sizes="(max-width: 860px) 100vw, 960px"
                      unoptimized
                      onClick={() => openLightbox(activeImage)}
                      style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                    />
                    <div onClick={() => openLightbox(activeImage)} style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      ⛶ Fullscreen
                    </div>
                    <div style={{ position: 'absolute', bottom: '0.7rem', right: '0.7rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', color: '#fff' }}>
                      {activeImage + 1} / {resolvedImages.length}
                    </div>
                    {resolvedImages.length > 1 && (
                      <>
                        {activeImage > 0 && (
                          <button onClick={() => setActiveImage(i => i - 1)} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                        )}
                        {activeImage < resolvedImages.length - 1 && (
                          <button onClick={() => setActiveImage(i => i + 1)} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                        )}
                      </>
                    )}
                  </div>
                  {resolvedImages.length > 1 && (
                    <div className="pd-thumbs">
                      {resolvedImages.map((img, i) => (
                        <Image key={i} src={img.resolvedUrl} alt="" width={80} height={60} unoptimized onClick={() => setActiveImage(i)}
                          className={`pd-thumb${activeImage === i ? ' active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="pd-main-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.4rem' }}>🏠</div>
                    <p style={{ fontSize: '0.82rem' }}>No images available</p>
                  </div>
                </div>
              )}

              {/* Mobile sidebar — price + enquiry between gallery and details */}
              <div className="pd-sidebar-mobile">
                <button
                  type="button"
                  className="pd-mobile-search-toggle"
                  onClick={() => setMobileSearchOpen((previous) => !previous)}
                >
                  <span style={{ fontSize: '1rem' }}>🔎</span>
                  <span>{mobileSearchOpen ? 'Hide Search' : 'Search Other Properties'}</span>
                </button>
                <SidebarContent
                  property={property}
                  neighbourhood={neighbourhood}
                  formatPrice={formatPrice}
                  showSearchCard={mobileSearchOpen}
                  showEnquiryCard={false}
                />
              </div>

              {/* Property Details */}
              {detailItems.length > 0 && (
                <div className="pd-card">
                  <p className="pd-card-label">Property Details</p>
                  <div className="pd-details-grid">
                    {detailItems.map(({ icon, label, value }) => (
                      <div key={label} style={{ padding: '0.85rem', background: 'var(--surface-3)', borderRadius: '10px', border: '1px solid var(--line-soft)' }}>
                        <div style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>{icon}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(features.length > 0 || property.Rooms) && (
                <div className="pd-card">
                  <p className="pd-card-label">Features</p>
                  {property.Rooms ? (
                    <div style={{ marginBottom: features.length > 0 ? '1rem' : 0, padding: '0.95rem 1rem', background: 'var(--surface-3)', borderRadius: '12px', border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Rooms</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{property.Rooms}</div>
                    </div>
                  ) : null}
                  {features.length > 0 && (
                    <div className="pd-feature-grid">
                      {features.map((feature) => (
                        <div key={feature} className="pd-feature-chip">
                          <span className="pd-feature-dot" />
                          <span className="pd-feature-text">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="pd-card">
                  <p className="pd-card-label">Description</p>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{description}</div>
                </div>
              )}

              {(similarLoading || similarProperties.length > 0) && (
                <div className="pd-card">
                  <p className="pd-card-label">Similar Properties</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.35rem' }}>
                        More {property.Property_Type} options
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '680px' }}>
                        {similarSectionSummary}
                      </p>
                    </div>
                    <Link href={browseListingsHref} style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                      Browse all {property.Listing_Type === 'For Sale' ? 'sale' : property.Listing_Type === 'For Rent' ? 'rent' : 'matching'} listings
                    </Link>
                  </div>

                  {similarLoading ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading similar properties...</p>
                  ) : (
                    <div className="pd-similar-grid">
                      {similarProperties.map((similarProperty) => (
                        <PropertyCard key={similarProperty.documentId || similarProperty.Property_Code} property={similarProperty} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pd-sidebar-mobile">
                <EnquiryCard
                  enquiryForm={enquiryForm}
                  setEnquiryForm={setEnquiryForm}
                  submitted={submitted}
                  handleEnquiry={handleEnquiry}
                  submitting={submitting}
                  submitError={submitError}
                />
              </div>
            </div>

            {/* ── RIGHT (desktop only) ── */}
            <div className="pd-sidebar-desktop">
              <SidebarContent
                property={property}
                neighbourhood={neighbourhood}
                formatPrice={formatPrice}
                enquiryForm={enquiryForm}
                setEnquiryForm={setEnquiryForm}
                submitted={submitted}
                handleEnquiry={handleEnquiry}
                submitting={submitting}
                submitError={submitError}
                showSearchCard
                showEnquiryCard
              />
            </div>

          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && resolvedImages.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={resolvedImages.map((img) => ({ src: img.resolvedUrl, alt: property.Title }))}
          plugins={[Thumbnails, Zoom]}
          thumbnails={{
            position: 'bottom',
            width: 80,
            height: 60,
            border: 2,
            borderRadius: 6,
            padding: 4,
            gap: 8,
          }}
          zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2 }}
          styles={{
            container: { backgroundColor: 'rgba(10,22,40,0.97)' },
          }}
          on={{
            view: ({ index }) => {
              setActiveImage(index);
              setLightboxIndex(index);
            }
          }}
        />
      )}
    </>
  );
}

function SidebarContent({
  property,
  neighbourhood,
  formatPrice,
  enquiryForm,
  setEnquiryForm,
  submitted,
  handleEnquiry,
  submitting,
  submitError,
  showSearchCard,
  showEnquiryCard = true,
}) {
  return (
    <>
      {showSearchCard ? (
        <PropertySearchBar
          key={`${property.Property_Code}-sidebar-search`}
          variant="sidebar"
          initialListingType={property.Listing_Type === 'For Sale' ? 'For Sale' : 'For Rent'}
          initialArea={neighbourhood || ''}
          initialBedrooms={property.Bedrooms ? String(property.Bedrooms) : ''}
        />
      ) : null}

      <div className="pd-price-card">
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
          {property.Listing_Type === 'For Rent' ? 'Monthly Rent' : 'Sale Price'}
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          {formatPrice(property.Price, property.Listing_Type)}
        </div>

        {(property.Bedrooms || property.Bathrooms || property.Area_Sqm) && (
          <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.1rem', paddingBottom: '1.1rem', borderBottom: '1px solid var(--line-soft)', flexWrap: 'wrap' }}>
            {property.Bedrooms  && <div><div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{property.Bedrooms}</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Beds</div></div>}
            {property.Bathrooms && <div><div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{property.Bathrooms}</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Baths</div></div>}
            {property.Area_Sqm  && <div><div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{property.Area_Sqm}</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>sqm</div></div>}
          </div>
        )}

        {property.Agent_Phone && (
          <a href={`tel:${property.Agent_Phone}`} className="pd-btn-red">📞 Call Agent</a>
        )}
        <a href={`https://wa.me/?text=Hi, I'm interested in ${encodeURIComponent(property.Title)} (${property.Property_Code})`} target="_blank" rel="noopener noreferrer" className="pd-btn-wa">
          💬 WhatsApp
        </a>
      </div>
      {showEnquiryCard ? (
        <EnquiryCard
          enquiryForm={enquiryForm}
          setEnquiryForm={setEnquiryForm}
          submitted={submitted}
          handleEnquiry={handleEnquiry}
          submitting={submitting}
          submitError={submitError}
        />
      ) : null}
    </>
  );
}

function EnquiryCard({
  enquiryForm,
  setEnquiryForm,
  submitted,
  handleEnquiry,
  submitting,
  submitError,
}) {
  return (
    <div className="pd-enquiry-card">
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', marginBottom: '1.1rem', color: 'var(--text-primary)' }}>Send Enquiry</h3>
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.6rem' }}>✅</div>
          <p style={{ color: '#22c55e', fontWeight: 500, marginBottom: '0.3rem' }}>Enquiry Sent!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>We&apos;ll get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleEnquiry}>
          {[
            { key: 'name',  label: 'Your Name', type: 'text',  placeholder: 'John Smith' },
            { key: 'phone', label: 'Phone',      type: 'tel',   placeholder: '+91 98765 43210' },
            { key: 'email', label: 'Email',      type: 'email', placeholder: 'john@example.com' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
              <input type={type} placeholder={placeholder} required className="pd-input"
                value={enquiryForm[key]} onChange={e => setEnquiryForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Message</label>
            <textarea rows={3} placeholder="I'm interested in this property..." className="pd-input"
              value={enquiryForm.message} onChange={e => setEnquiryForm(f => ({ ...f, message: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          {submitError && (
            <p style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'center' }}>{submitError}</p>
          )}
          <button type="submit" className="pd-btn-red" style={{ marginBottom: 0, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Enquiry'}
          </button>
        </form>
      )}
    </div>
  );
}
