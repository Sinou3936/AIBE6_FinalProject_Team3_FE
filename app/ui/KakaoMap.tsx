'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

type KakaoMapProps = {
  latitude: number;
  longitude: number;
  title: string;
  address: string;
  className?: string;
};

type KakaoMapSdk = {
  maps: {
    LatLng: new (latitude: number, longitude: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { map: unknown; position: unknown; title?: string }) => unknown;
    load: (callback: () => void) => void;
  };
};

declare global {
  interface Window {
    kakao?: KakaoMapSdk;
  }
}

let kakaoMapLoader: Promise<KakaoMapSdk> | null = null;
const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

function loadKakaoMap(appKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Map can only be loaded in the browser.'));
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoMapLoader) {
    return kakaoMapLoader;
  }

  kakaoMapLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]');

    const handleLoad = () => {
      window.kakao?.maps.load(() => {
        if (window.kakao) {
          resolve(window.kakao);
        } else {
          reject(new Error('Kakao Map SDK is not available.'));
        }
      });
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Kakao Map SDK.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.dataset.kakaoMapSdk = 'true';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = () => reject(new Error('Failed to load Kakao Map SDK.'));
    document.head.appendChild(script);
  });

  return kakaoMapLoader;
}

export function KakaoMap({ latitude, longitude, title, address, className }: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'missing-key' | 'error'>(() =>
    kakaoMapAppKey ? 'idle' : 'missing-key',
  );

  useEffect(() => {
    if (!kakaoMapAppKey) {
      return;
    }

    let isMounted = true;

    loadKakaoMap(kakaoMapAppKey)
      .then((kakao) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = new kakao.maps.LatLng(latitude, longitude);
        const map = new kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 3,
        });

        new kakao.maps.Marker({
          map,
          position: center,
          title,
        });
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [address, latitude, longitude, title]);

  if (status !== 'idle') {
    return (
      <div className={`flex min-h-[250px] items-center justify-center bg-slate-100 p-6 ${className ?? ''}`}>
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-600">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <p className="mb-1 font-bold text-slate-950">{title}</p>
          <p className="mb-3 text-sm text-slate-600">{address}</p>
          <p className="text-xs leading-relaxed text-slate-500">
            {status === 'missing-key'
              ? '카카오맵을 표시하려면 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다.'
              : '카카오맵을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'}
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainerRef} className={`min-h-[250px] bg-slate-100 ${className ?? ''}`} />;
}
