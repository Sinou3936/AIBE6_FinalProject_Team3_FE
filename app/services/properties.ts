import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapPropertySummaryDto } from '../mappers/property';
import { getMockProperties, getMockPropertyById } from '../repositories/propertyRepository';
import { type PropertySummaryDto } from '../types/api';
import { type PropertySummary } from '../types/domain';

export async function getProperties(): Promise<PropertySummary[]> {
  if (useMockData) {
    return getMockProperties();
  }

  const dtos = await requestJson<PropertySummaryDto[]>('/properties');
  return dtos.map(mapPropertySummaryDto);
}

export async function getPropertyById(id: number): Promise<PropertySummary | undefined> {
  if (useMockData) {
    return getMockPropertyById(id);
  }

  const dto = await requestJson<PropertySummaryDto>(`/properties/${id}`);
  return mapPropertySummaryDto(dto);
}
