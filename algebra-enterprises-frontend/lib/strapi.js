import axios from 'axios';

export const STRAPI_BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const strapiURL = STRAPI_BASE_URL;
export const PROPERTY_NEIGHBOURHOOD_FILTER_KEY = 'Neighbourhood';

export function getStrapiMediaUrl(url) {
  if (!url) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (!strapiURL) {
    return url;
  }

  return `${strapiURL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function getPropertyNeighbourhood(property) {
  const value = property?.Neighbourhood ?? property?.Neighborhood;

  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return typeof value === 'string' ? value : '';
}

export async function getProperties(filters = {}) {
  let query = `${strapiURL}/api/properties?populate=Images`;

  if (filters.status) {
    query += `&filters[Property_Status][$eq]=${filters.status}`;
  }
  if (filters.listing_type) {
    query += `&filters[Listing_Type][$eq]=${filters.listing_type}`;
  }
  if (filters.neighborhood) {
    query += `&filters[${PROPERTY_NEIGHBOURHOOD_FILTER_KEY}][$contains]=${encodeURIComponent(filters.neighborhood)}`;
  }
  if (filters.featured) {
    query += `&filters[Featured_Property][$eq]=true`;
  }

  const res = await axios.get(query);
  return res.data.data;
}

export async function getProperty(property_code) {
  const res = await axios.get(
    `${strapiURL}/api/properties?filters[Property_Code][$eq]=${property_code}&populate=Images`
  );
  return res.data.data[0];
}
