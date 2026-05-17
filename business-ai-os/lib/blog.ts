import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { unstable_cache } from 'next/cache'

// Articles sont dans seo-content/articles/ (un niveau au-dessus de brainlo/)
const ARTICLES_DIR = path.join(process.cwd(), '..', 'seo-content', 'articles')

export interface ArticleMeta {
  slug: string
  title: string
  meta_title: string
  meta_description: string
  description?: string
  keywords: string[]
  author: string
  date: string
  category: string
  reading_time: string
}

export interface Article extends ArticleMeta {
  contentHtml: string
}

// Lit tous les articles et retourne leurs métadonnées (sans HTML)
// Mis en cache 24h avec unstable_cache pour perf optimale en dev et prod
export const getAllArticles = unstable_cache(
  async (): Promise<ArticleMeta[]> => {
    if (!fs.existsSync(ARTICLES_DIR)) return []

    const fileNames = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))

    const articles = fileNames.map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(ARTICLES_DIR, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)

      return {
        slug,
        title: data.title || '',
        meta_title: data.meta_title || data.title || '',
        meta_description: data.meta_description || '',
        description: data.meta_description || '',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        author: data.author || 'Brainlo',
        date: data.date || '',
        category: data.category || '',
        reading_time: data.reading_time || '5 min',
      } as ArticleMeta
    })

    // Trier par date décroissante
    return articles.sort((a, b) => (a.date < b.date ? 1 : -1))
  },
  ['blog-articles'],
  { revalidate: 86400, tags: ['blog'] }
)

// Retourne les slugs de tous les articles (pour generateStaticParams)
export function getAllSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return []
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}

// Lit un article complet avec contenu HTML
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const fullPath = path.join(ARTICLES_DIR, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  // Convertir Markdown → HTML
  const processedContent = await remark().use(html).process(content)
  const contentHtml = processedContent.toString()

  return {
    slug,
    title: data.title || '',
    meta_title: data.meta_title || data.title || '',
    meta_description: data.meta_description || '',
    description: data.meta_description || '',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    author: data.author || 'Brainlo',
    date: data.date || '',
    category: data.category || '',
    reading_time: data.reading_time || '5 min',
    contentHtml,
  }
}
