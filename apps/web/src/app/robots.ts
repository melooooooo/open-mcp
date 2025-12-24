import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:30001'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/user/profile/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
