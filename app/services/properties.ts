import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapPropertyListItemDto, mapPropertySummaryDto } from '../mappers/property';
import { getMockProperties, getMockPropertyById } from '../repositories/propertyRepository';
import {
  type CreatePropertyRequestDto,
  type CreatePropertyResponseDto,
  type PropertyListItemDto,
  type PropertySummaryDto,
} from '../types/api';
import { type PropertySummary } from '../types/domain';

export async function getProperties(): Promise<PropertySummary[]> {
  if (useMockData) {
    return getMockProperties();
  }

  const dtos = await requestJson<PropertyListItemDto[]>('/properties');
  return dtos.map(mapPropertyListItemDto);
}

// 상세조회는 아직 mock 전용이다: 실제 GET /properties/{id} 응답에는 기능4/5/체크리스트 관련 필드가
// 없어서 PropertyDetailClient(지도/차트 포함)가 기대하는 형태와 맞지 않는다. 별도 이슈에서 연결한다.
export async function getPropertyById(id: number): Promise<PropertySummary | undefined> {
  if (useMockData) {
    return getMockPropertyById(id);
  }

  const dto = await requestJson<PropertySummaryDto>(`/properties/${id}`);
  return mapPropertySummaryDto(dto);
}

export async function createProperty(request: CreatePropertyRequestDto): Promise<CreatePropertyResponseDto> {
  if (useMockData) {
    return {
      propertyId: Date.now(),
      status: 'ACTIVE',
      address: {
        roadAddress: request.address,
        jibunAddress: request.address,
        latitude: 0,
        longitude: 0,
      },
      marketComparison: {
        status: 'UNAVAILABLE',
        referencePrice: null,
        differenceRate: null,
        sampleCount: null,
        referenceDate: null,
      },
      notice: null,
    };
  }

  return requestJson<CreatePropertyResponseDto>('/properties', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
