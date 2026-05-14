import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/(auth)/',
          '/print/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://businessaios.com/sitemap.xml',
    host: 'https://businessaios.com',
  }
}
