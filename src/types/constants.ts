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
