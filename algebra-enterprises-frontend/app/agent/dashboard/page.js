'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPropertyNeighbourhood, getStrapiMediaUrl } from '@/lib/strapi';

const STATUS_OPTIONS = ['Live', 'Rented Out', 'Sold'];
const LISTING_TYPE_OPTIONS = ['For Rent', 'For Sale', 'For Rent and For Sale'];
const PROPERTY_TYPE_OPTIONS = [
  'Apartment',
  'Entire Building',
  'Independent House',
  'Duplex',
  'Service Apartment',
  'Farm House',
];
const NEIGHBORHOOD_OPTIONS = [
  'Anand Niketan',
  'Asola',
  'Bandh Road',
  'Bijwasan',
  'Chanakyapuri',
  'Chandan Hola',
  'Chattarpur',
  'Defence Colony',
  'Dera Mandi',
  'Friends Colony West',
  'G.K Enclave 1',
  'G.K-1',
  'G.K-2',
  'Gadaipur',
  'Ghitorni',
  'Golf Links',
  'Green Park Extension',
  'Green Park Main',
  'Gulmohar Park',
  'Hauz Khas',
  'Jangpura Extension',
  'Jor Bagh',
  'Kapashera',
  'Lajpat Nagar',
  'Mayfair Garden',
  'Neeti Bagh',
  'Nizamuddin East',
  'Panchsheel Park',
  'Pansheel Enclave',
  'Pushpanjali',
  'Radhey Mohan Drive',
  'Safdarjung Enclave',
  'Sarvodaya Enclave',
  'Satbari',
  'SDA',
  'Shanti Niketan',
  'South Extension Part 1',
  'Sultanpur',
  'Sundar Nagar',
  'Vasant Kunj Bhawani Kunj',
  'Vasant Kunj Farms',
  'Vasant Vihar',
  'Westend',
  'Westend Greens',
];
const FEATURE_OPTIONS = [
  'Air Conditioning',
  'Balcony',
  'Basement',
  'Brand New',
  'Corner Plot',
  'Dining Room',
  'Driveway Parking',
  'Equipped Kitchen',
  'Four Side Open',
  'Front Terrace',
  'Fruit & Vegetable Garden',
  'Fully Furnished',
  'Furnished',
  'Gas Pipeline',
  'Generator',
  'Gym Room',
  'Inverter',
  'Laundry Room',
  'Lawn',
  'Lift',
  'Living Room',
  'Marble Floors',
  'Outside Parking',
  'Park Facing',
  'Powder Room',
  'Power Backup',
  'Quiet Location',
  'Security',
  'Semi Furnished',
  'Staff Quarter',
  'Stilt Parking',
  'Study Room',
  'Swimming Pool',
  'Terrace',
  'Two Side Open',
  'UPVC Window',
  'Wide Road',
];
const MAX_IMAGE_FILES = 50;
const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const STATUS_COLORS = { Live: '#22c55e', 'Rented Out': '#f59e0b', Sold: '#ef4444' };
const STATUS_BG = {
  Live: 'rgba(34,197,94,0.1)',
  'Rented Out': 'rgba(245,158,11,0.1)',
  Sold: 'rgba(239,68,68,0.1)',
};

function createEmptyPropertyForm() {
  return {
    Title: '',
    Property_Code: '',
    Neighborhood: '',
    Listing_Type: 'For Rent',
    Property_Type: 'Apartment',
    Property_Status: 'Live',
    Price: '',
    Bedrooms: '',
    Bathrooms: '',
    Area_Sqm: '',
    Area_sqft: '',
    Area_Acre: '',
    Property_Address: '',
    Agent_Phone: '',
    Property_Age: '',
    Description: '',
    Featured_Property: false,
    Features: [],
    Images: [],
  };
}

function parseApiError(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.error?.message === 'string' && payload.error.message.trim()) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function prepareImageSelection(fileList) {
  const selectedFiles = Array.from(fileList || []);
  const validImages = [];
  const issues = [];

  for (const file of selectedFiles) {
    if (!file.type.startsWith('image/')) {
      issues.push(`${file.name} is not an image file.`);
      continue;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      issues.push(`${file.name} is larger than 15MB.`);
      continue;
    }

    validImages.push(file);
  }

  if (validImages.length > MAX_IMAGE_FILES) {
    issues.push(`Only the first ${MAX_IMAGE_FILES} images will be uploaded.`);
  }

  return {
    files: validImages.slice(0, MAX_IMAGE_FILES),
    error: issues[0] || '',
  };
}

function stringifyFormValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function descriptionToPlainText(description) {
  if (!Array.isArray(description)) {
    return '';
  }

  return description
    .map((block) =>
      Array.isArray(block?.children)
        ? block.children.map((child) => child?.text || '').join('')
        : ''
    )
    .filter(Boolean)
    .join('\n\n');
}

function normalizeListValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    return [trimmed];
  }

  return [];
}

function propertyToForm(property) {
  const neighborhood = getPropertyNeighbourhood(property);

  return {
    Title: property.Title || '',
    Property_Code: property.Property_Code || '',
    Neighborhood: neighborhood,
    Listing_Type: property.Listing_Type || 'For Rent',
    Property_Type: property.Property_Type || 'Apartment',
    Property_Status: property.Property_Status || 'Live',
    Price: stringifyFormValue(property.Price),
    Bedrooms: stringifyFormValue(property.Bedrooms),
    Bathrooms: stringifyFormValue(property.Bathrooms),
    Area_Sqm: stringifyFormValue(property.Area_Sqm),
    Area_sqft: stringifyFormValue(property.Area_sqft),
    Area_Acre: stringifyFormValue(property.Area_Acre),
    Property_Address: property.Property_Address || '',
    Agent_Phone: property.Agent_Phone || '',
    Property_Age: stringifyFormValue(property.Property_Age),
    Description: descriptionToPlainText(property.Description),
    Featured_Property: Boolean(property.Featured_Property),
    Features: normalizeListValue(property.Features),
    Images: [],
  };
}

async function fetchDashboardData() {
  const response = await fetch('/api/agent/dashboard', { cache: 'no-store' });

  if (response.status === 401) {
    const error = new Error('Unauthorized');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!response.ok) {
    throw new Error('Unable to load dashboard data.');
  }

  return response.json();
}

function matchesPropertySearch(property, searchTerm) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const neighborhood = getPropertyNeighbourhood(property);

  return (
    property.Title?.toLowerCase().includes(query) ||
    neighborhood.toLowerCase().includes(query) ||
    property.Property_Code?.toLowerCase().includes(query)
  );
}

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [createForm, setCreateForm] = useState(createEmptyPropertyForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createImageError, setCreateImageError] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const data = await fetchDashboardData();

        if (ignore) {
          return;
        }

        setAgent(data.agent);
        setProperties(data.properties);
        setEnquiries(data.enquiries);
      } catch (error) {
        if (!ignore && error?.code === 'UNAUTHORIZED') {
          router.replace('/agent/login');
        } else if (!ignore) {
          console.error(error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [router]);

  useEffect(() => {
    const nextPreviews = createForm.Images.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [createForm.Images]);

  const isEditingProperty = Boolean(editingProperty);

  async function updateStatus(propertyId, newStatus) {
    setUpdating(propertyId);

    try {
      const response = await fetch(`/api/agent/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setProperties((previous) =>
          previous.map((property) =>
            property.documentId === propertyId
              ? { ...property, Property_Status: newStatus }
              : property
          )
        );
      }
    } catch (error) {
      console.error(error);
    }

    setUpdating(null);
  }

  async function updateEnquiryStatus(enquiryId, newStatus) {
    try {
      const response = await fetch(`/api/agent/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(parseApiError(payload, 'Unable to update enquiry status right now.'));
      }

      setEnquiries((previous) =>
        previous.map((enquiry) =>
          enquiry.documentId === enquiryId
            ? { ...enquiry, Client_Status: newStatus }
            : enquiry
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/agent/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore logout cleanup failures and continue redirecting.
    }

    router.push('/agent/login');
  }

  function handleCreateFieldChange(field, value) {
    setCreateForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleFeature(feature) {
    setCreateForm((previous) => ({
      ...previous,
      Features: previous.Features.includes(feature)
        ? previous.Features.filter((item) => item !== feature)
        : [...previous.Features, feature],
    }));
  }

  function handleImageSelection(event) {
    const { files, error } = prepareImageSelection(event.target.files);
    handleCreateFieldChange('Images', files);
    setCreateImageError(error);
  }

  function resetPropertyFormState() {
    setCreateForm(createEmptyPropertyForm());
    setCreateError('');
    setCreateImageError('');
    setCreateSuccess('');
    setEditingProperty(null);
    setImageInputKey((previous) => previous + 1);
  }

  function startEditingProperty(property) {
    setEditingProperty(property);
    setCreateForm(propertyToForm(property));
    setCreateError('');
    setCreateImageError('');
    setCreateSuccess('');
    setImageInputKey((previous) => previous + 1);
    setActiveTab('add-property');
  }

  async function handleCreateProperty(event) {
    event.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');
    setCreateSuccess('');

    if (createImageError) {
      setCreateSubmitting(false);
      setCreateError(createImageError);
      return;
    }

    const formData = new FormData();

    formData.append('Title', createForm.Title);
    formData.append('Property_Code', createForm.Property_Code);
    formData.append('Neighborhood', createForm.Neighborhood);
    formData.append('Listing_Type', createForm.Listing_Type);
    formData.append('Property_Type', createForm.Property_Type);
    formData.append('Property_Status', createForm.Property_Status);
    formData.append('Price', createForm.Price);
    formData.append('Bedrooms', createForm.Bedrooms);
    formData.append('Bathrooms', createForm.Bathrooms);
    formData.append('Area_Sqm', createForm.Area_Sqm);
    formData.append('Area_sqft', createForm.Area_sqft);
    formData.append('Area_Acre', createForm.Area_Acre);
    formData.append('Property_Address', createForm.Property_Address);
    formData.append('Agent_Phone', createForm.Agent_Phone);
    formData.append('Property_Age', createForm.Property_Age);
    formData.append('Description', createForm.Description);
    formData.append('Featured_Property', createForm.Featured_Property ? 'true' : 'false');
    formData.append('Features', JSON.stringify(createForm.Features));

    createForm.Images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const endpoint = isEditingProperty
        ? `/api/agent/properties/${editingProperty.documentId}`
        : '/api/agent/properties';
      const response = await fetch(endpoint, {
        method: isEditingProperty ? 'PUT' : 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          parseApiError(
            payload,
            isEditingProperty
              ? 'Unable to update property right now.'
              : 'Unable to add property right now.'
          )
        );
      }

      const createdProperty = payload?.data;

      if (!createdProperty) {
        throw new Error(
          isEditingProperty
            ? 'Property was updated but the response was incomplete.'
            : 'Property was created but the response was incomplete.'
        );
      }

      setProperties((previous) =>
        isEditingProperty
          ? previous.map((property) =>
              property.documentId === createdProperty.documentId ? createdProperty : property
            )
          : [createdProperty, ...previous]
      );
      setCreateForm(createEmptyPropertyForm());
      setCreateSuccess(
        isEditingProperty
          ? createForm.Images.length > 0
            ? 'Property updated successfully. Replacement images were watermarked and optimized.'
            : 'Property updated successfully.'
          : 'Property created successfully. Uploaded images were watermarked and optimized.'
      );
      setCreateImageError('');
      setEditingProperty(null);
      setImageInputKey((previous) => previous + 1);
      setActiveTab('properties');
      setSearchTerm('');
      setFilterStatus('All');
    } catch (error) {
      setCreateError(error.message || 'Unable to add property right now.');
    } finally {
      setCreateSubmitting(false);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchSearch = matchesPropertySearch(property, searchTerm);
    const matchStatus = filterStatus === 'All' || property.Property_Status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: properties.length,
    live: properties.filter((property) => property.Property_Status === 'Live').length,
    rented: properties.filter((property) => property.Property_Status === 'Rented Out').length,
    sold: properties.filter((property) => property.Property_Status === 'Sold').length,
    newLeads: enquiries.filter((enquiry) => enquiry.Client_Status === 'New').length,
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: '3px solid rgba(201,168,76,0.2)',
              borderTop: '3px solid #c9a84c',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#8a9bb5', fontFamily: 'DM Sans, sans-serif' }}>Loading dashboard...</p>
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a1628; font-family: DM Sans, sans-serif; }
        .dash-wrap { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .dash-input,
        .dash-select,
        .dash-textarea,
        .dash-file {
          width: 100%;
          padding: 0.7rem 0.9rem;
          background: rgba(10,22,40,0.8);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          font-family: DM Sans, sans-serif;
        }
        .dash-input::placeholder,
        .dash-textarea::placeholder { color: #8a9bb5; }
        .dash-input:focus,
        .dash-select:focus,
        .dash-textarea:focus,
        .dash-file:focus { border-color: rgba(201,168,76,0.45); }
        .dash-textarea { min-height: 120px; resize: vertical; }
        .tab-btn {
          padding: 0.55rem 1.2rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: DM Sans, sans-serif;
          transition: all 0.2s;
        }
        .status-btn {
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: DM Sans, sans-serif;
          transition: all 0.2s;
        }
        .prop-row {
          background: rgba(17,34,64,0.6);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1rem 1.2rem;
          margin-bottom: 0.75rem;
          display: grid;
          grid-template-columns: 60px 1fr auto auto;
          gap: 1rem;
          align-items: center;
        }
        .form-card {
          background: rgba(17,34,64,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.4rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .form-field.full {
          grid-column: 1 / -1;
        }
        .field-label {
          font-size: 0.75rem;
          color: #c9a84c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .feature-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }
        .feature-chip {
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: #8a9bb5;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
          font-family: DM Sans, sans-serif;
        }
        .feature-chip.active {
          background: rgba(201,168,76,0.14);
          color: #fff;
          border-color: rgba(201,168,76,0.45);
          box-shadow: 0 8px 20px rgba(201,168,76,0.12);
        }
        .info-note {
          margin: 0;
          padding: 0.85rem 1rem;
          border-radius: 10px;
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .success-note {
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.28);
          color: #bbf7d0;
        }
        .error-note {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.28);
          color: #fecaca;
        }
        .helper-note {
          background: rgba(129,140,248,0.12);
          border: 1px solid rgba(129,140,248,0.22);
          color: #c7d2fe;
        }
        @media (max-width: 900px) {
          .form-grid,
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 700px) {
          .prop-row { grid-template-columns: 1fr; gap: 0.6rem; }
          .dash-wrap { padding: 0 1rem; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a1628', paddingBottom: '3rem' }}>
        <div
          style={{
            background: 'rgba(17,34,64,0.95)',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            padding: '1rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="dash-wrap"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#fff',
                }}
              >
                A
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '0.95rem',
                    color: '#fff',
                    lineHeight: 1.1,
                  }}
                >
                  Agent Dashboard
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#c9a84c',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Algebra Enterprises
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#8a9bb5' }}>
                👤 {agent?.username || agent?.email}
              </span>
              <Link
                href="/"
                style={{ fontSize: '0.8rem', color: '#8a9bb5', textDecoration: 'none' }}
              >
                Website ↗
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '7px',
                  border: '1px solid rgba(192,57,43,0.4)',
                  background: 'transparent',
                  color: '#e74c3c',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        <div className="dash-wrap" style={{ paddingTop: '2rem' }}>
          <div
            className="stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {[
              { label: 'My Properties', value: stats.total, color: '#c9a84c' },
              { label: 'Live', value: stats.live, color: '#22c55e' },
              { label: 'Rented Out', value: stats.rented, color: '#f59e0b' },
              { label: 'Sold', value: stats.sold, color: '#ef4444' },
              { label: 'New Leads', value: stats.newLeads, color: '#818cf8' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(17,34,64,0.7)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    fontFamily: 'Playfair Display, serif',
                    color,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#8a9bb5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginTop: '0.2rem',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: 'rgba(17,34,64,0.5)',
              padding: '4px',
              borderRadius: '10px',
              width: 'fit-content',
              flexWrap: 'wrap',
            }}
          >
            {[
              ['properties', `My Properties (${stats.total})`],
              ['enquiries', `Enquiries (${enquiries.length})`],
              ['add-property', isEditingProperty ? 'Edit Property' : 'Add Property'],
            ].map(([tab, label]) => (
              <button
                key={tab}
                className="tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(192,57,43,0.9)' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#8a9bb5',
                  boxShadow: activeTab === tab ? '0 3px 10px rgba(192,57,43,0.4)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'properties' && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1.2rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <input
                  className="dash-input"
                  placeholder="Search properties by title, code, or neighborhood"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  style={{ minWidth: 220, flex: 1, maxWidth: 360 }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    background: 'rgba(17,34,64,0.5)',
                    padding: '3px',
                    borderRadius: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  {['All', ...STATUS_OPTIONS].map((status) => (
                    <button
                      key={status}
                      className="tab-btn"
                      onClick={() => setFilterStatus(status)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: filterStatus === status ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: filterStatus === status ? '#fff' : '#8a9bb5',
                        fontSize: '0.78rem',
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {createSuccess ? <p className="info-note success-note">{createSuccess}</p> : null}

              {filteredProperties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8a9bb5' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🏠</div>
                  <p>No properties found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                  {properties.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
                      Use the Add Property tab to publish your first listing.
                    </p>
                  ) : null}
                </div>
              ) : (
                filteredProperties.map((property) => {
                  const imageUrl = getStrapiMediaUrl(property.Images?.[0]?.url);

                  return (
                    <div key={property.id} className="prop-row">
                      <div
                        style={{
                          width: 60,
                          height: 48,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'rgba(10,22,40,0.5)',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            sizes="60px"
                            unoptimized
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              opacity: 0.3,
                            }}
                          >
                            🏠
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#fff',
                            marginBottom: '0.2rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {property.Title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8a9bb5', marginBottom: '0.2rem' }}>
                          {getPropertyNeighbourhood(property) ? `📍 ${getPropertyNeighbourhood(property)} · ` : ''}
                          {property.Listing_Type} · {property.Property_Code}
                        </div>
                        {property.Property_Address ? (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#c9a84c',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.3rem',
                            }}
                          >
                            <span>🔒</span>
                            <span style={{ wordBreak: 'break-word' }}>{property.Property_Address}</span>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            className="status-btn"
                            onClick={() => updateStatus(property.documentId, status)}
                            disabled={updating === property.documentId}
                            style={{
                              background: property.Property_Status === status ? STATUS_BG[status] : 'transparent',
                              color: property.Property_Status === status ? STATUS_COLORS[status] : '#8a9bb5',
                              border: `1px solid ${
                                property.Property_Status === status
                                  ? STATUS_COLORS[status]
                                  : 'rgba(255,255,255,0.1)'
                              }`,
                              opacity: updating === property.documentId ? 0.6 : 1,
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => startEditingProperty(property)}
                          style={{
                            border: '1px solid rgba(201,168,76,0.25)',
                            background: 'rgba(201,168,76,0.08)',
                            color: '#c9a84c',
                            borderRadius: '7px',
                            padding: '0.45rem 0.8rem',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Edit
                        </button>
                        <Link
                          href={`/properties/${property.Property_Code}`}
                          target="_blank"
                          style={{
                            color: '#c9a84c',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View ↗
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'enquiries' && (
            <>
              {enquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8a9bb5' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📬</div>
                  <p>No enquiries yet.</p>
                </div>
              ) : (
                enquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    style={{
                      background: 'rgba(17,34,64,0.6)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      padding: '1.1rem 1.3rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#fff',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {enquiry.Name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#8a9bb5', marginBottom: '0.2rem' }}>
                          📞 {enquiry.Phone} · ✉️ {enquiry.Email}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#c9a84c' }}>
                          🏠 {enquiry.Property_Title} ({enquiry.Property_Code})
                        </div>
                        {enquiry.Message ? (
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: '#cbd5e1',
                              marginTop: '0.5rem',
                              lineHeight: 1.5,
                            }}
                          >
                            {enquiry.Message}
                          </div>
                        ) : null}
                        <div style={{ fontSize: '0.7rem', color: '#8a9bb5', marginTop: '0.4rem' }}>
                          {new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        {['New', 'Contacted', 'Closed'].map((status) => (
                          <button
                            key={status}
                            className="status-btn"
                            onClick={() => updateEnquiryStatus(enquiry.documentId, status)}
                            style={{
                              background:
                                enquiry.Client_Status === status
                                  ? status === 'New'
                                    ? 'rgba(129,140,248,0.15)'
                                    : status === 'Contacted'
                                      ? 'rgba(245,158,11,0.15)'
                                      : 'rgba(34,197,94,0.15)'
                                  : 'transparent',
                              color:
                                enquiry.Client_Status === status
                                  ? status === 'New'
                                    ? '#818cf8'
                                    : status === 'Contacted'
                                      ? '#f59e0b'
                                      : '#22c55e'
                                  : '#8a9bb5',
                              border: `1px solid ${
                                enquiry.Client_Status === status
                                  ? status === 'New'
                                    ? '#818cf8'
                                    : status === 'Contacted'
                                      ? '#f59e0b'
                                      : '#22c55e'
                                  : 'rgba(255,255,255,0.1)'
                              }`,
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'add-property' && (
            <div className="form-card">
              <div style={{ marginBottom: '1.2rem' }}>
                <div
                  style={{
                    fontSize: '1.15rem',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: 'Playfair Display, serif',
                    marginBottom: '0.35rem',
                  }}
                >
                  {isEditingProperty ? 'Edit Property' : 'Add New Property'}
                </div>
                <p style={{ margin: 0, color: '#8a9bb5', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {isEditingProperty
                    ? 'Update the assigned property details here. If you upload new images, they replace the current gallery after server-side optimization and watermarking.'
                    : 'Any uploaded image is processed on the server before it is stored: the file is resized, optimized, and stamped with an Algebra Enterprises watermark automatically.'}
                </p>
              </div>

              {createError ? <p className="info-note error-note">{createError}</p> : null}
              {!createError && createImageError ? <p className="info-note error-note">{createImageError}</p> : null}
              {!createError && createSuccess ? <p className="info-note success-note">{createSuccess}</p> : null}
              <p className="info-note helper-note" style={{ marginBottom: '1rem' }}>
                Required fields: Title, Property Code, Neighborhood, and Private Address. Images are
                optional. Upload up to 50 JPG, PNG, or WebP files, with a 15MB limit per image.
                {isEditingProperty ? ' Leave the image picker empty to keep the current gallery.' : ''}
              </p>

              <form onSubmit={handleCreateProperty} className="form-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    className="dash-input"
                    value={createForm.Title}
                    onChange={(event) => handleCreateFieldChange('Title', event.target.value)}
                    placeholder="Luxury apartment in Vasant Vihar"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="property-code">
                    Property Code
                  </label>
                  <input
                    id="property-code"
                    className="dash-input"
                    value={createForm.Property_Code}
                    onChange={(event) => handleCreateFieldChange('Property_Code', event.target.value)}
                    placeholder="ag2001"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="neighborhood">
                    Neighborhood
                  </label>
                  <select
                    id="neighborhood"
                    className="dash-select"
                    value={createForm.Neighborhood}
                    onChange={(event) => handleCreateFieldChange('Neighborhood', event.target.value)}
                    required
                  >
                    <option value="" style={{ background: '#0a1628' }}>
                      Select neighborhood
                    </option>
                    {NEIGHBORHOOD_OPTIONS.map((option) => (
                      <option key={option} value={option} style={{ background: '#0a1628' }}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="listing-type">
                    Listing Type
                  </label>
                  <select
                    id="listing-type"
                    className="dash-select"
                    value={createForm.Listing_Type}
                    onChange={(event) => handleCreateFieldChange('Listing_Type', event.target.value)}
                  >
                    {LISTING_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option} style={{ background: '#0a1628' }}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="property-type">
                    Property Type
                  </label>
                  <select
                    id="property-type"
                    className="dash-select"
                    value={createForm.Property_Type}
                    onChange={(event) => handleCreateFieldChange('Property_Type', event.target.value)}
                  >
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option} style={{ background: '#0a1628' }}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="property-status">
                    Status
                  </label>
                  <select
                    id="property-status"
                    className="dash-select"
                    value={createForm.Property_Status}
                    onChange={(event) => handleCreateFieldChange('Property_Status', event.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option} style={{ background: '#0a1628' }}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="price">
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="dash-input"
                    value={createForm.Price}
                    onChange={(event) => handleCreateFieldChange('Price', event.target.value)}
                    placeholder="125"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="bedrooms">
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    type="number"
                    min="0"
                    className="dash-input"
                    value={createForm.Bedrooms}
                    onChange={(event) => handleCreateFieldChange('Bedrooms', event.target.value)}
                    placeholder="4"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="bathrooms">
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    type="number"
                    min="0"
                    className="dash-input"
                    value={createForm.Bathrooms}
                    onChange={(event) => handleCreateFieldChange('Bathrooms', event.target.value)}
                    placeholder="4"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="area-sqm">
                    Area (sqm)
                  </label>
                  <input
                    id="area-sqm"
                    type="number"
                    min="0"
                    step="0.01"
                    className="dash-input"
                    value={createForm.Area_Sqm}
                    onChange={(event) => handleCreateFieldChange('Area_Sqm', event.target.value)}
                    placeholder="280"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="area-sqft">
                    Area (sqft)
                  </label>
                  <input
                    id="area-sqft"
                    type="number"
                    min="0"
                    step="0.01"
                    className="dash-input"
                    value={createForm.Area_sqft}
                    onChange={(event) => handleCreateFieldChange('Area_sqft', event.target.value)}
                    placeholder="3013"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="area-acre">
                    Area (acre)
                  </label>
                  <input
                    id="area-acre"
                    type="number"
                    min="0"
                    step="0.01"
                    className="dash-input"
                    value={createForm.Area_Acre}
                    onChange={(event) => handleCreateFieldChange('Area_Acre', event.target.value)}
                    placeholder="0.5"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="agent-phone">
                    Agent Phone
                  </label>
                  <input
                    id="agent-phone"
                    className="dash-input"
                    value={createForm.Agent_Phone}
                    onChange={(event) => handleCreateFieldChange('Agent_Phone', event.target.value)}
                    placeholder="+91 98XXXXXX"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="property-age">
                    Property Age
                  </label>
                  <input
                    id="property-age"
                    type="number"
                    min="0"
                    className="dash-input"
                    value={createForm.Property_Age}
                    onChange={(event) => handleCreateFieldChange('Property_Age', event.target.value)}
                    placeholder="3"
                  />
                </div>

                <div className="form-field full">
                  <label className="field-label" htmlFor="property-address">
                    Private Address
                  </label>
                  <textarea
                    id="property-address"
                    className="dash-textarea"
                    value={createForm.Property_Address}
                    onChange={(event) => handleCreateFieldChange('Property_Address', event.target.value)}
                    placeholder="Full street address shown only to authenticated agents"
                    required
                  />
                </div>

                <div className="form-field full">
                  <label className="field-label" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="dash-textarea"
                    value={createForm.Description}
                    onChange={(event) => handleCreateFieldChange('Description', event.target.value)}
                    placeholder="Describe the property, layout, highlights, and nearby landmarks"
                  />
                </div>

                <div className="form-field full">
                  <label className="field-label" htmlFor="images">
                    Images
                  </label>
                  <input
                    key={imageInputKey}
                    id="images"
                    type="file"
                    accept="image/*"
                    className="dash-file"
                    multiple
                    onChange={handleImageSelection}
                  />
                  <div style={{ color: '#8a9bb5', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {isEditingProperty
                      ? 'Upload JPG, PNG, or WebP images only if you want to replace the current gallery. New uploads are resized, optimized, and watermarked automatically before storage.'
                      : 'Upload JPG, PNG, or WebP images. They will be resized, optimized, and watermarked automatically before storage.'}
                  </div>
                  {isEditingProperty && editingProperty?.Images?.length > 0 ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div
                        style={{
                          color: '#c9a84c',
                          fontSize: '0.76rem',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                        }}
                      >
                        Current Gallery
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: '0.75rem',
                        }}
                      >
                        {editingProperty.Images.map((image) => (
                          <div
                            key={image.id}
                            style={{
                              background: 'rgba(10,22,40,0.5)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                aspectRatio: '4 / 3',
                                backgroundImage: `url(${getStrapiMediaUrl(image.url)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                            <div style={{ padding: '0.65rem 0.7rem', color: '#cbd5e1', fontSize: '0.75rem' }}>
                              {image.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {createForm.Images.length > 0 ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: '0.75rem',
                        }}
                      >
                        {imagePreviews.map((preview) => (
                          <div
                            key={preview.key}
                            style={{
                              background: 'rgba(10,22,40,0.5)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                aspectRatio: '4 / 3',
                                backgroundImage: `url(${preview.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                            <div style={{ padding: '0.65rem 0.7rem' }}>
                              <div
                                style={{
                                  color: '#fff',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginBottom: '0.2rem',
                                }}
                              >
                                {preview.name}
                              </div>
                              <div style={{ color: '#8a9bb5', fontSize: '0.72rem' }}>
                                {preview.sizeLabel}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {createForm.Images.map((file) => (
                          <span
                            key={`${file.name}-${file.size}`}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '999px',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#cbd5e1',
                              fontSize: '0.75rem',
                            }}
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="form-field full">
                  <label className="field-label">Features</label>
                  <div className="feature-grid">
                    {FEATURE_OPTIONS.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        className={`feature-chip${createForm.Features.includes(feature) ? ' active' : ''}`}
                        onClick={() => toggleFeature(feature)}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field full">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      color: '#fff',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={createForm.Featured_Property}
                      onChange={(event) =>
                        handleCreateFieldChange('Featured_Property', event.target.checked)
                      }
                    />
                    Mark this as a featured property
                  </label>
                </div>

                <div className="form-field full" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="tab-btn"
                    onClick={resetPropertyFormState}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#8a9bb5',
                    }}
                  >
                    {isEditingProperty ? 'Cancel Edit' : 'Reset Form'}
                  </button>
                  <button
                    type="submit"
                    className="tab-btn"
                    disabled={createSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(192,57,43,0.28)',
                      opacity: createSubmitting ? 0.7 : 1,
                    }}
                  >
                    {createSubmitting
                      ? isEditingProperty
                        ? 'Saving...'
                        : 'Publishing...'
                      : isEditingProperty
                        ? 'Save Changes'
                        : 'Publish Property'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
