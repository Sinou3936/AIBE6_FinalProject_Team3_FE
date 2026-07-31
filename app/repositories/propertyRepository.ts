import { mapPropertySummaryDto } from '../mappers/property';
import { initPropertySummaryDtos } from '../mocks/init/properties';
import { type PropertySummary } from '../types/domain';

const mockProperties: PropertySummary[] = initPropertySummaryDtos.map(mapPropertySummaryDto);

export function getMockProperties(): PropertySummary[] {
  return mockProperties;
}

export function getMockPropertyById(id: number): PropertySummary | undefined {
  return mockProperties.find((property) => property.id === id);
}
