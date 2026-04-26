/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://careerbridge.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin', '/admin/*', '/api/*', '/500'],

  // Per-path priority overrides — landing pages get higher priority since
  // they're our main organic-search entry points.
  transform: async (config, path) => {
    let priority = config.priority;
    let changefreq = config.changefreq;

    // Home page = highest priority
    if (path === '/') {
      priority = 1.0;
    }
    // SEO landing pages — give them above-default priority
    else if (
      path.startsWith('/jobs/') ||
      path.startsWith('/category/') ||
      path.startsWith('/company/') ||
      path.startsWith('/fresher-jobs')
    ) {
      priority = 0.9;
      changefreq = 'daily';
    }
    // Blog posts — daily content but lower priority than job pages
    else if (path.startsWith('/blog/')) {
      priority = 0.6;
      changefreq = 'weekly';
    }
    // Legal pages — almost never change
    else if (
      path === '/about' || path === '/privacy' || path === '/terms' ||
      path === '/disclaimer' || path === '/contact'
    ) {
      priority = 0.3;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },

  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/api/'] },
    ],
  },
};