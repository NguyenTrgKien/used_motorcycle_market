export const LISTING_VEHICLE_FIELDS = [
  'brandName',
  'modelName',
  'bodyType',
  'manufactureYear',
  'registrationYear',
  'mileage',
  'color',
  'condition',
  'engineCapacity',
  'enginePower',
  'batteryCapacity',
  'rangePerCharge',
  'licensePlate',
  'fuelType',
  'transmission',
  'origin',
  'documentsStatus',
  'seatCount',
  'doorCount',
  'payloadKg',
  'grossWeightKg',
  'wheelCount',
] as const;

export type ListingVehicleField = (typeof LISTING_VEHICLE_FIELDS)[number];

export interface ListingFormSchema {
  version: number;
  visibleFields: ListingVehicleField[];
  requiredFields: ListingVehicleField[];
  requiredWhenUsedFields: ListingVehicleField[];
  aiFields: ListingVehicleField[];
}

const commonFields: ListingVehicleField[] = [
  'brandName',
  'modelName',
  'bodyType',
  'manufactureYear',
  'registrationYear',
  'color',
  'condition',
  'origin',
];

const poweredFields: ListingVehicleField[] = [
  ...commonFields,
  'mileage',
  'engineCapacity',
  'enginePower',
  'licensePlate',
  'fuelType',
  'transmission',
  'documentsStatus',
];

function schema(
  visibleFields: ListingVehicleField[],
  requiredFields: ListingVehicleField[],
  requiredWhenUsedFields: ListingVehicleField[] = [],
): ListingFormSchema {
  return {
    version: 1,
    visibleFields,
    requiredFields,
    requiredWhenUsedFields,
    aiFields: visibleFields,
  };
}

export function getDefaultListingFormSchema(slug: string): ListingFormSchema {
  if (slug === 'xe-dap') {
    return schema(
      commonFields.filter((field) => field !== 'bodyType'),
      ['brandName', 'condition'],
      [],
    );
  }
  if (slug === 'xe-dien') {
    return schema(
      [
        ...commonFields,
        'mileage',
        'enginePower',
        'batteryCapacity',
        'rangePerCharge',
        'licensePlate',
        'fuelType',
        'transmission',
        'documentsStatus',
        'seatCount',
        'doorCount',
        'wheelCount',
      ],
      ['brandName', 'modelName', 'bodyType', 'condition'],
      ['mileage'],
    );
  }
  if (slug === 'o-to') {
    return schema(
      [...poweredFields, 'batteryCapacity', 'rangePerCharge', 'seatCount', 'doorCount', 'wheelCount'],
      ['brandName', 'modelName', 'bodyType', 'condition', 'fuelType', 'transmission'],
      ['mileage'],
    );
  }
  if (slug === 'xe-tai' || slug === 'xe-chuyen-dung') {
    return schema(
      [...poweredFields, 'seatCount', 'wheelCount', 'payloadKg', 'grossWeightKg'],
      ['brandName', 'modelName', 'bodyType', 'condition', 'fuelType', 'transmission'],
      ['mileage'],
    );
  }
  if (slug === 'xe-may') {
    return schema(
      [...poweredFields, 'batteryCapacity', 'rangePerCharge'],
      ['brandName', 'modelName', 'bodyType', 'condition', 'fuelType', 'transmission'],
      ['mileage'],
    );
  }
  return schema(commonFields, ['condition'], []);
}

export function normalizeListingFormSchema(
  value: ListingFormSchema | undefined,
  slug: string,
) {
  const fallback = getDefaultListingFormSchema(slug);
  if (!value || !Array.isArray(value.visibleFields)) return fallback;
  const valid = new Set<string>(LISTING_VEHICLE_FIELDS);
  const clean = (fields: ListingVehicleField[] | undefined) =>
    [...new Set((fields || []).filter((field) => valid.has(field)))];
  return {
    version: Number(value.version) || 1,
    visibleFields: clean(value.visibleFields),
    requiredFields: clean(value.requiredFields),
    requiredWhenUsedFields: clean(value.requiredWhenUsedFields),
    aiFields: clean(value.aiFields),
  } satisfies ListingFormSchema;
}
