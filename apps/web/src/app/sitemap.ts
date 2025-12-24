import { MetadataRoute } from 'next'
import { getAllExperienceSlugs } from '@/lib/api/experiences'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:30001'

  // Static routes
  const staticRoutes = [
    '',
    '/experiences',
    '/companies',
    '/category',
    '/about',
    '/advertise',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic experience articles
  const experienceItems = await getAllExperienceSlugs()
  const experienceRoutes = experienceItems.map((item) => ({
    url: `${baseUrl}/experiences/${encodeURIComponent(item.slug || '')}`,
    lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...experienceRoutes]
}
