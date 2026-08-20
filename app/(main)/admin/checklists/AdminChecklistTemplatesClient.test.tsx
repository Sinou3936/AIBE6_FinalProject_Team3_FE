import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type AdminChecklistItemTemplateDto } from '../../../types/api';
import { AdminChecklistTemplatesClient } from './AdminChecklistTemplatesClient';

const createAdminChecklistItemTemplate = vi.fn();
const updateAdminChecklistItemTemplate = vi.fn();
const deleteAdminChecklistItemTemplate = vi.fn();
const addAdminChecklistTemplateImage = vi.fn();
const deleteAdminChecklistTemplateImage = vi.fn();
vi.mock('../../../services/adminActions', () => ({
  createAdminChecklistItemTemplate: (...args: unknown[]) => createAdminChecklistItemTemplate(...args),
  updateAdminChecklistItemTemplate: (...args: unknown[]) => updateAdminChecklistItemTemplate(...args),
  deleteAdminChecklistItemTemplate: (...args: unknown[]) => deleteAdminChecklistItemTemplate(...args),
  addAdminChecklistTemplateImage: (...args: unknown[]) => addAdminChecklistTemplateImage(...args),
  deleteAdminChecklistTemplateImage: (...args: unknown[]) => deleteAdminChecklistTemplateImage(...args),
}));

const getAdminChecklistTemplateImages = vi.fn();
vi.mock('../../../services/admin', () => ({
  getAdminChecklistTemplateImages: (...args: unknown[]) => getAdminChecklistTemplateImages(...args),
}));

function template(overrides: Partial<AdminChecklistItemTemplateDto> = {}): AdminChecklistItemTemplateDto {
  return {
    id: 1,
    version: 1,
    code: null,
    category: 'INDOOR',
    content: '창문 잠금장치가 정상 작동하나요?',
    guideText: null,
    helperText: null,
    importance: 'GENERAL',
    itemType: 'CHECK',
    options: null,
    displayOrder: 1,
    active: true,
    applicablePropertyTypes: null,
    ...overrides,
  };
}

describe('AdminChecklistTemplatesClient', () => {
  // 회귀 테스트 - TRUST_REGISTRATION/OWNERSHIP_MATCH 자동 판정 코드는 백엔드 ChecklistItem.answerYesNo()
  // 에서만 확인되므로, 응답 방식을 YES_NO가 아닌 값으로 두고 저장하면 자동 주의 판정이 조용히
  // 죽는다(경고 없이 저장 자체는 성공했었다). 이제는 저장 시점에 막혀야 한다.
  it('자동 판정 코드와 맞지 않는 응답 방식으로 저장하면 에러를 보여주고 저장하지 않는다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([]);
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '문항 추가' }));

    fireEvent.change(screen.getByLabelText(/문항 내용/), { target: { value: '신탁등기가 되어있나요?' } });
    // 응답 방식은 기본값 CHECK로 둔 채 자동 판정 코드만 TRUST_REGISTRATION으로 선택한다.
    fireEvent.change(screen.getByLabelText(/자동 판정 코드/), { target: { value: 'TRUST_REGISTRATION' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText(/사용할 수 있습니다/)).toBeInTheDocument();
    expect(createAdminChecklistItemTemplate).not.toHaveBeenCalled();
  });

  // 회귀 테스트 - OWNERSHIP_ACQUISITION_DATE/TAX_DELINQUENCY_NOTICE는 자동 주의 판정과는
  // 무관하지만(ChecklistItemCode 자바독 참고), 백엔드 validateCode()는 이 둘도 다른 4개 코드와
  // 동일하게 고정된 itemType을 요구해 어긋나면 무조건 거부한다. 프론트가 이 두 코드를
  // CODE_REQUIRED_ITEM_TYPES에서 빠뜨렸을 때는 저장 버튼을 누른 뒤 서버 에러로만 드러났다.
  it('OWNERSHIP_ACQUISITION_DATE 코드와 맞지 않는 응답 방식으로 저장하면 에러를 보여주고 저장하지 않는다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([]);
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '문항 추가' }));

    fireEvent.change(screen.getByLabelText(/문항 내용/), { target: { value: '소유권 취득일이 언제인가요?' } });
    // 응답 방식은 기본값 CHECK로 둔 채(요구되는 DATE가 아님) 코드만 OWNERSHIP_ACQUISITION_DATE로 선택한다.
    fireEvent.change(screen.getByLabelText(/자동 판정 코드/), { target: { value: 'OWNERSHIP_ACQUISITION_DATE' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText(/사용할 수 있습니다/)).toBeInTheDocument();
    expect(createAdminChecklistItemTemplate).not.toHaveBeenCalled();
  });

  it('자동 판정 코드와 응답 방식이 맞으면 정상 저장된다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([]);
    createAdminChecklistItemTemplate.mockResolvedValue(template());
    const onMutated = vi.fn();
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={onMutated} />);

    fireEvent.click(screen.getByRole('button', { name: '문항 추가' }));
    fireEvent.change(screen.getByLabelText(/문항 내용/), { target: { value: '신탁등기가 되어있나요?' } });
    fireEvent.change(screen.getByLabelText(/응답 방식/), { target: { value: 'YES_NO' } });
    fireEvent.change(screen.getByLabelText(/자동 판정 코드/), { target: { value: 'TRUST_REGISTRATION' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('문항 추가'); // 모달이 닫히기 전 마지막 렌더가 안정될 때까지 대기
    expect(createAdminChecklistItemTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TRUST_REGISTRATION', itemType: 'YES_NO' }),
    );
  });

  it('수정 모달에서 내용을 바꾸고 저장하면 updateAdminChecklistItemTemplate을 호출하고 목록을 새로고침한다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([]);
    updateAdminChecklistItemTemplate.mockResolvedValue(template());
    const onMutated = vi.fn();
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={onMutated} />);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByText('등록된 예시 이미지가 없습니다.');

    fireEvent.change(screen.getByLabelText(/문항 내용/), { target: { value: '창문이 잘 잠기나요?' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('문항 추가'); // 모달이 닫힌 뒤 안정될 때까지 대기
    expect(updateAdminChecklistItemTemplate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ content: '창문이 잘 잠기나요?' }),
    );
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼 확인 시 deleteAdminChecklistItemTemplate을 호출하고 목록을 새로고침한다', async () => {
    deleteAdminChecklistItemTemplate.mockResolvedValue(undefined);
    const onMutated = vi.fn();
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={onMutated} />);

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await screen.findByText('이 문항을 삭제할까요?');

    const dialogHeading = screen.getByText('이 문항을 삭제할까요?');
    const dialog = dialogHeading.parentElement as HTMLElement;
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deleteAdminChecklistItemTemplate).toHaveBeenCalledWith(1));
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  it('삭제 실패 시 모달을 닫지 않고 에러 메시지를 보여준다', async () => {
    deleteAdminChecklistItemTemplate.mockRejectedValueOnce(new Error('삭제할 수 없습니다.'));
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await screen.findByText('이 문항을 삭제할까요?');
    const dialog = screen.getByText('이 문항을 삭제할까요?').parentElement as HTMLElement;
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('이 문항을 삭제할까요?')).toBeInTheDocument();
  });

  it('수정 모달에서 이미지를 추가하면 목록에 반영되고 입력창이 비워진다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([]);
    addAdminChecklistTemplateImage.mockResolvedValue({ id: 100, imageUrl: 'https://example.com/a.png' });
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByText('등록된 예시 이미지가 없습니다.');

    fireEvent.change(screen.getByPlaceholderText('이미지 URL 붙여넣기'), {
      target: { value: 'https://example.com/a.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(addAdminChecklistTemplateImage).toHaveBeenCalledWith(1, { imageUrl: 'https://example.com/a.png' }),
    );
    expect(await screen.findByText('https://example.com/a.png')).toBeInTheDocument();
    expect((screen.getByPlaceholderText('이미지 URL 붙여넣기') as HTMLInputElement).value).toBe('');
  });

  it('수정 모달에서 이미지를 삭제하면 목록에서 사라진다', async () => {
    getAdminChecklistTemplateImages.mockResolvedValue([{ id: 100, imageUrl: 'https://example.com/a.png' }]);
    deleteAdminChecklistTemplateImage.mockResolvedValue(undefined);
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByText('https://example.com/a.png');

    // 배경의 테이블 행에도 같은 라벨의 "삭제" 버튼이 있어(Modal이 언마운트하지 않고 덮어씌우는
    // 방식), 모달 컨테이너로 범위를 좁혀 이미지 목록의 삭제 버튼만 클릭한다.
    const modalContainer = screen.getByText('문항 수정').parentElement as HTMLElement;
    // 삭제는 이제 확인 없이 바로 실행되지 않는다 - 첫 클릭은 "정말 삭제할까요?" 인라인 확인으로
    // 바꾸고, 그 확인 상태의 "삭제" 버튼을 다시 눌러야 실제 삭제 요청이 나간다.
    fireEvent.click(within(modalContainer).getByRole('button', { name: '삭제' }));
    await within(modalContainer).findByText('정말 삭제할까요?');
    fireEvent.click(within(modalContainer).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deleteAdminChecklistTemplateImage).toHaveBeenCalledWith(1, 100));
    await waitFor(() => expect(screen.queryByText('https://example.com/a.png')).not.toBeInTheDocument());
  });

  it('이미지 로딩 실패 시 에러 메시지를 보여준다', async () => {
    getAdminChecklistTemplateImages.mockRejectedValueOnce(new Error('예시 이미지를 불러오지 못했습니다.'));
    render(<AdminChecklistTemplatesClient data={[template()]} onMutated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(await screen.findByText('예시 이미지를 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
