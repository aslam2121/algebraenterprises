export const PROPERTY_SEARCH_NEIGHBOURHOODS = [
  'Vasant Vihar',
  'Defence Colony',
  'Anand Niketan',
  'Safdarjung Enclave',
  'Hauz Khas',
  'Chanakyapuri',
  'Golf Links',
  'Jor Bagh',
  'Vasant Kunj Farms',
  'Westend',
  'Shanti Niketan',
  'Nizamuddin East',
  'SDA',
  'Green Park Main',
  'Green Park Extension',
];

export const BEDROOM_FILTER_OPTIONS = [
  { label: 'Any Bedrooms', value: '' },
  { label: '1 Bedroom', value: '1' },
  { label: '2 Bedrooms', value: '2' },
  { label: '3 Bedrooms', value: '3' },
  { label: '4 Bedrooms', value: '4' },
  { label: '5 Bedrooms', value: '5' },
  { label: '6 Bedrooms', value: '6' },
  { label: '7 Bedrooms', value: '7' },
  { label: '8 Bedrooms', value: '8' },
  { label: '9 Bedrooms', value: '9' },
  { label: '10+ Bedrooms', value: '10+' },
];

export function getSearchQueryType(listingType) {
  if (listingType === 'For Sale') {
    return 'sale';
  }

  return 'rent';
}

export function getListingTypeFromQueryValue(value) {
  if (value === 'sale') {
    return 'For Sale';
  }

  if (value === 'rent') {
    return 'For Rent';
  }

  return 'All';
}
