import { type ContractInfoItemDto, type ContractRiskItemDto } from '../../types/api';

export const initContractRiskItemDtos: ContractRiskItemDto[] = [
  {
    id: 1,
    original: '임대인은 개인 사정에 따라 계약 기간 중 목적물 명도를 요청할 수 있다.',
    severityTone: 'orange',
    simple: '집주인이 원하면 계약 기간 중에도 집을 비워달라고 할 수 있다는 뜻으로 읽힐 수 있습니다.',
    why: '임차인의 거주 기간은 법적으로 보호받아야 합니다. 임대인의 개인 사정만으로 퇴거를 요구하는 조항은 분쟁 위험이 큽니다.',
    question: '임대인이 계약 기간 중 임의로 계약 종료나 퇴거를 요구할 수 있는 조건인지 확인해 주세요.',
    suggestion: '계약 기간 중 퇴거 요청은 법령 또는 상호 합의에 따른 경우로 제한한다.',
  },
  {
    id: 2,
    original: '보증금 반환은 새로운 임차인이 들어온 이후에 지급하기로 한다.',
    severityTone: 'red',
    simple: '다음 세입자가 구해져야 보증금을 돌려받을 수 있다는 뜻입니다.',
    why: '보증금 반환은 계약 종료와 동시에 이뤄져야 할 핵심 의무입니다. 다음 임차인 여부와 묶이면 반환 지연 위험이 큽니다.',
    question: '새 임차인 여부와 관계없이 계약 종료일에 보증금을 반환받을 수 있나요?',
    suggestion: '임대인은 계약 종료일에 보증금 전액을 즉시 반환한다.',
  },
  {
    id: 3,
    original: '임대인은 잔금 지급일까지 근저당권을 설정할 수 있다.',
    severityTone: 'orange',
    simple: '입주 전 집주인이 집을 담보로 추가 대출을 받을 수 있다는 뜻입니다.',
    why: '선순위 권리가 생기면 보증금보다 먼저 변제되는 채권이 늘어날 수 있습니다.',
    question: '계약 체결 후 잔금일까지 추가 근저당을 설정하지 않는 특약을 넣을 수 있나요?',
    suggestion: '임대인은 계약 체결일부터 잔금 지급일 다음 날까지 추가 근저당권을 설정하지 않는다.',
  },
];

export const initContractInfoItemDtos: ContractInfoItemDto[] = [
  { label: '주소', value: '서울시 관악구 신림동 1422-5' },
  { label: '보증금', value: '1억 8,000만원' },
  { label: '월세', value: '0원 (전세)' },
  { label: '계약 기간', value: '24개월' },
  { label: '임대인', value: '김**' },
];
