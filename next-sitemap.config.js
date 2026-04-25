/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://careerbridge.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin', '/admin/*', '/api/*', '/500'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/api/'] },
    ],
    // No `additionalSitemaps` — next-sitemap auto-references its own
    // generated sitemap.xml in robots.txt. Listing it here causes a duplicate.
  },
};