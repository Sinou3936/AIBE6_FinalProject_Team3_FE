import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import {
  mapPropertyDetailResponseDto,
  mapPropertyListItemDto,
  mapPropertySummaryToMockDetail,
} from '../mappers/property';
import { getMockProperties, getMockPropertyById } from '../repositories/propertyRepository';
import {
  type CreatePropertyRequestDto,
  type CreatePropertyResponseDto,
  type PropertyDetailResponseDto,
  type PropertyListItemDto,
  type PropertyReportResponseDto,
  type ReportPropertyRequestDto,
  type UpdatePropertyRequestDto,
} from '../types/api';
import { type PropertyDetail, type PropertySummary } from '../types/domain';

export async function getProperties(cookieHeader?: string): Promise<PropertySummary[]> {
  if (useMockData) {
    return getMockProperties();
  }

  const dtos = await requestJson<PropertyListItemDto[]>(
    '/properties',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
  return dtos.map(mapPropertyListItemDto);
}

export async function getPropertyById(id: number, cookieHeader?: string): Promise<PropertyDetail | undefined> {
  if (useMockData) {
    const property = getMockPropertyById(id);
    return property ? mapPropertySummaryToMockDetail(property) : undefined;
  }

  const dto = await requestJson<PropertyDetailResponseDto>(
    `/properties/${id}`,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
  return mapPropertyDetailResponseDto(dto);
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

export async function updateProperty(id: number, request: UpdatePropertyRequestDto): Promise<PropertyDetail> {
  if (useMockData) {
    const property = getMockPropertyById(id);
    if (!property) {
      throw new Error('매물을 찾을 수 없습니다.');
    }
    return mapPropertySummaryToMockDetail(property);
  }

  const dto = await requestJson<PropertyDetailResponseDto>(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
  return mapPropertyDetailResponseDto(dto);
}

export async function deleteProperty(id: number): Promise<void> {
  if (useMockData) {
    return;
  }

  await requestJson<void>(`/properties/${id}`, { method: 'DELETE' });
}

// mock 모드에는 신고 이력을 저장할 저장소가 없어 매번 성공만 반환한다 - 중복신고(409) 같은
// 에러 케이스는 실제 API 모드에서만 재현 가능하다.
export async function reportProperty(id: number, request: ReportPropertyRequestDto): Promise<PropertyReportResponseDto> {
  if (useMockData) {
    return {
      reportId: Date.now(),
      propertyId: id,
      reason: request.reason,
      detail: request.reason === 'ETC' ? (request.detail ?? null) : null,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
    };
  }

  return requestJson<PropertyReportResponseDto>(`/properties/${id}/reports`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
