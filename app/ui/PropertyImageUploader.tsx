'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { roomTypeLabelMap } from '../mappers/property';
import { uploadPropertyImage } from '../services/propertyImages';
import { type RoomTypeDto } from '../types/api';
import { type PropertyImage, type RoomType } from '../types/domain';

type UploadStatus = 'uploading' | 'done' | 'error';

type UploadItem = {
  id: string;
  previewUrl: string;
  status: UploadStatus;
  imageUrl?: string;
  roomType: RoomType | null;
};

type PropertyImageUploaderProps = {
  value: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  disabled?: boolean;
  maxCount?: number;
};

const roomTypeOptions = Object.entries(roomTypeLabelMap) as [RoomTypeDto, string][];

/**
 * 매물 사진 업로드 위젯. 파일을 고르면 즉시 업로드(upload-url → S3 PUT → confirm)를 시작하고,
 * 업로드가 끝난 이미지마다 방 라벨(room_type)을 선택할 수 있게 한다. 등록/수정 폼 양쪽에서
 * 공용으로 쓴다 - 수정 폼은 value로 기존 이미지를 넘겨 "이미 업로드됨" 상태로 초기화한다.
 * onChange는 업로드가 실제로 끝난(status === 'done') 이미지만 부모에게 전달한다 - 실패하거나
 * 아직 업로드 중인 항목은 폼 제출 시 절대 섞여 들어가지 않는다.
 */
export function PropertyImageUploader({ value, onChange, disabled, maxCount = 10 }: PropertyImageUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>(() =>
    value.map((image, index) => ({
      id: `existing-${index}-${image.imageUrl}`,
      previewUrl: image.imageUrl,
      status: 'done' as const,
      imageUrl: image.imageUrl,
      roomType: image.roomType,
    })),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChange(
      items
        .filter((item) => item.status === 'done' && item.imageUrl)
        .map((item) => ({ imageUrl: item.imageUrl as string, roomType: item.roomType })),
    );
    // onChange는 부모 렌더마다 새로 만들어질 수 있어 의존성에 넣으면 무한 루프 위험이 있다 -
    // items가 바뀔 때만 부모에 알리면 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const activeCount = items.filter((item) => item.status !== 'error').length;
  const isUploading = items.some((item) => item.status === 'uploading');

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remainingSlots = maxCount - activeCount;
    if (remainingSlots <= 0) {
      setError(`이미지는 최대 ${maxCount}장까지 등록할 수 있어요.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);
    const newItems: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
      roomType: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    await Promise.all(
      files.map(async (file, index) => {
        const item = newItems[index];
        try {
          const imageUrl = await uploadPropertyImage(file);
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'done', imageUrl } : p)));
        } catch {
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: 'error' } : p)));
        }
      }),
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  // 배열의 첫 항목을 대표사진으로 취급한다 (별도 필드 없이 순서로 표현).
  // BE는 순서를 보장하는 컬럼(@OrderBy 등) 없이 저장 시점의 삽입 순서를 그대로 돌려주므로,
  // 등록/수정 폼이 항상 전체 images 배열을 이 순서 그대로 제출하기만 하면 대표사진 지정이 유지된다.
  function moveItem(id: string, direction: -1 | 1) {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function updateRoomType(id: string, roomType: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, roomType: (roomType || null) as RoomType | null } : item)),
    );
  }

  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">매물 사진 (선택, 최대 {maxCount}장)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={disabled || isUploading || activeCount >= maxCount}
          onChange={(event) => {
            void handleFilesSelected(event.target.files);
            event.target.value = '';
          }}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-60"
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {items.length > 1 && (
        <p className="mt-2 text-xs text-slate-500">첫 번째 사진이 대표사진으로 노출돼요. 화살표로 순서를 바꿀 수 있어요.</p>
      )}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="relative h-28 w-full bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob 미리보기 URL은 next/image가 지원하지 않음 */}
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                {index === 0 && item.status !== 'error' && (
                  <span className="absolute left-1 top-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    대표
                  </span>
                )}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">
                    업로드 중...
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/60 text-xs font-bold text-white">
                    업로드 실패
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={disabled}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white disabled:opacity-60"
                >
                  <X className="h-3 w-3" />
                </button>
                {items.length > 1 && item.status !== 'error' && (
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      disabled={disabled || index === 0}
                      aria-label="앞으로 이동"
                      className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      disabled={disabled || index === items.length - 1}
                      aria-label="뒤로 이동"
                      className="rounded-full bg-black/60 p-1 text-white disabled:opacity-30"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {item.status === 'done' && (
                <select
                  value={item.roomType ?? ''}
                  onChange={(event) => updateRoomType(item.id, event.target.value)}
                  disabled={disabled}
                  className="w-full border-t border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 disabled:opacity-60"
                >
                  <option value="">라벨 없음</option>
                  {roomTypeOptions.map(([optionValue, label]) => (
                    <option key={optionValue} value={optionValue}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
