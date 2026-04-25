// lib/blog.js — markdown blog loader (build-time only)
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Blog markdown files live OUTSIDE pages/ so Next doesn't try to route them.
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function safeReadDir() {
  try {
    if (!fs.existsSync(BLOG_DIR)) return [];
    return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
}

export function getAllPostSlugs() {
  return safeReadDir().map((f) => f.replace(/\.md$/, ''));
}

export function getAllPostsMeta() {
  return safeReadDir()
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      try {
        const source = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
        const { data } = matter(source);
        return {
          slug,
          title: data.title || slug,
          description: data.description || '',
          date: data.date || '1970-01-01',
          tags: Array.isArray(data.tags) ? data.tags : [],
          author: data.author || 'CareerBridge Team',
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(slug) {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    const source = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(source);
    const processed = await remark().use(html).process(content);
    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '1970-01-01',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || 'CareerBridge Team',
      htmlContent: processed.toString(),
    };
  } catch {
    return null;
  }
}