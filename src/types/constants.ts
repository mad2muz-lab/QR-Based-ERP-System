// src/types/constants.ts

export const MATERIAL_TYPES = [
  'Bitumen',
  'Aggregate',
  'Steel',
  'Cement',
  'Admixture',
  'Asphalt Emulsion',
  'Diesel',
  'Lubricant',
  'PVC Pipes',
  'Geotextile',
  'Spare Parts'
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

// Units of Measurement
export const UNITS_OF_MEASUREMENT = [
  'Tons',
  'Cubic Meters',
  'Liters',
  'Pieces',
  'Meters',
  'Square Meters',
  'Kilograms',
  'Bags',
  'Rolls',
  'Sheets',
  'Cartridges',
  'Sets',
  'Boxes',
  'Bottles',
  'Cans',
  'Tubes',
  'Packs',
  'Units',
  'Gallons',
  'Pounds'
] as const;

export type UnitOfMeasurement = (typeof UNITS_OF_MEASUREMENT)[number];
