import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy';
  return {
    name: `${brandName} - Smart Pharmacy Management`,
    short_name: brandName,
    description: 'Smart online pharmacy management and ordering system',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#14b8a6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
