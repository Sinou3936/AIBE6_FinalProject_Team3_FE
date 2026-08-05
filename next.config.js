/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        // 매물 이미지 업로드(S3) 조회 URL - PropertyImageUploader/PropertyDetailClient가
        // next/image로 렌더링하려면 원격 호스트를 명시적으로 허용해야 한다.
        hostname: '*.s3.ap-northeast-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
