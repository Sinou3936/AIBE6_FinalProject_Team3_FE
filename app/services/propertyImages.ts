import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import {
  type PropertyImageConfirmRequestDto,
  type PropertyImageConfirmResponseDto,
  type PropertyImageUploadUrlRequestDto,
  type PropertyImageUploadUrlResponseDto,
} from '../types/api';

async function issueUploadUrl(
  request: PropertyImageUploadUrlRequestDto,
): Promise<PropertyImageUploadUrlResponseDto> {
  return requestJson<PropertyImageUploadUrlResponseDto>('/properties/images/upload-url', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

async function confirmUpload(request: PropertyImageConfirmRequestDto): Promise<PropertyImageConfirmResponseDto> {
  return requestJson<PropertyImageConfirmResponseDto>('/properties/images/confirm', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

function fileExtensionOf(file: File): string {
  const dotIndex = file.name.lastIndexOf('.');
  return dotIndex >= 0 ? file.name.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * 매물 이미지 한 장을 업로드하고 확정된 조회 URL을 반환한다.
 * 1) upload-url로 presigned PUT URL을 받고 2) 그 URL로 S3에 파일을 직접 PUT한 뒤
 * 3) confirm으로 업로드 완료를 확인한다 - requestJson은 항상 우리 백엔드로만 요청을 보내므로,
 * 2번 단계(S3로 직접 PUT)는 requestJson을 거치지 않고 raw fetch를 쓴다.
 *
 * mock 모드는 실제 S3/백엔드가 없으므로 파일을 브라우저 메모리에서만 미리보기 URL로 바꿔 반환한다
 * (페이지를 벗어나면 무효화되지만, 등록/수정 자체도 mock 모드에서는 실제로 저장되지 않으므로 문제 없음).
 */
export async function uploadPropertyImage(file: File): Promise<string> {
  if (useMockData) {
    return URL.createObjectURL(file);
  }

  const { uploadUrl, key } = await issueUploadUrl({
    fileExtension: fileExtensionOf(file),
    contentType: file.type,
    fileSize: file.size,
  });

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  const { imageUrl } = await confirmUpload({ key });
  return imageUrl;
}
