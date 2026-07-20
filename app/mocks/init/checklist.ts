import { type ChecklistItemDto } from '../../types/api';

export const initChecklistItemDtos: ChecklistItemDto[] = [
  { id: 1, category: 'indoor', text: '벽면, 천장, 바닥에 누수 흔적이나 곰팡이가 없나요?', status: null },
  { id: 2, category: 'indoor', text: '수압과 배수가 안정적이고 악취가 없나요?', status: null },
  { id: 3, category: 'indoor', text: '콘센트, 조명, 난방, 냉방이 정상 작동하나요?', status: null },
  { id: 4, category: 'indoor', text: '창문과 문 잠금장치가 정상 작동하나요?', status: null },
  { id: 5, category: 'noise', text: '층간소음이나 외부 소음이 생활에 무리가 없는 수준인가요?', status: null },
  { id: 6, category: 'noise', text: '채광, 환기, 사생활 보호가 충분한가요?', status: null },
  { id: 7, category: 'noise', text: '쓰레기 배출 장소와 주변 위생 상태를 확인했나요?', status: null },
  { id: 8, category: 'safety', text: '공동현관 잠금장치, CCTV, 현관 보안 상태를 확인했나요?', status: null },
  { id: 9, category: 'safety', text: '방범창, 창문 잠금, 화재감지기 등 안전 설비가 있나요?', status: null },
  { id: 10, category: 'safety', text: '건물 출입구와 복도 조명이 충분한가요?', status: null },
  { id: 11, category: 'documents', text: '등기부등본의 소유자와 계약 당사자가 일치하나요?', status: null },
  {
    id: 12,
    category: 'documents',
    text: '확정일자 부여현황 또는 전입세대열람원을 임대인에게 요청했나요?',
    status: null,
  },
  {
    id: 13,
    category: 'documents',
    text: '선순위 보증금이나 근저당 등 보증금보다 먼저 변제될 권리를 확인했나요?',
    status: null,
  },
  { id: 14, category: 'documents', text: '관리비 포함 항목과 별도 비용을 계약 전 확인했나요?', status: null },
  { id: 15, category: 'area', text: '지하철, 버스정류장, 학교나 직장까지의 이동 시간을 확인했나요?', status: null },
  { id: 16, category: 'area', text: '편의시설, 병원, 마트 등 생활 시설이 충분한가요?', status: null },
  { id: 17, category: 'area', text: '야간 귀가 동선과 주변 밝기를 확인했나요?', status: null },
  { id: 18, category: 'area', text: '주차나 자전거 보관 등 필요한 생활 조건을 확인했나요?', status: null },
];
