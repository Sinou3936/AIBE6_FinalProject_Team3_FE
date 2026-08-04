'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyChecklistOverviews } from '../../services/checklist';
import { type ChecklistOverview } from '../../types/domain';
import { ChecklistOverviewClient } from './ChecklistOverviewClient';

export default function Page() {
  const [overviews, setOverviews] = useState<ChecklistOverview[]>([]);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyChecklistOverviews()
      .then((result) => {
        if (!cancelled) setOverviews(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError('체크리스트 목록을 불러오지 못했습니다. API 설정을 확인해 주세요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return <ChecklistOverviewClient overviews={overviews} loadError={loadError} />;
}
