import axios from 'axios';

const strapiURL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function getProperties(filters = {}) {
  let query = `${strapiURL}/api/properties?populate=Images`;

  if (filters.status) {
    query += `&filters[Property_Status][$eq]=${filters.status}`;
  }
  if (filters.listing_type) {
    query += `&filters[Listing_Type][$eq]=${filters.listing_type}`;
  }
  if (filters.neighborhood) {
    query += `&filters[Neighborhood][$eq]=${filters.neighborhood}`;
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