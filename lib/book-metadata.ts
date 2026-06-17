// Static metadata per slug — publisher, pages and publication year sourced from real editions.
// When these columns are eventually added to the DB, this file can be removed.
export interface BookMeta {
  pages: number
  publisher: string
  publishedYear: number
}

const META: Record<string, BookMeta> = {
  'el-arte-de-la-guerra': {
    pages: 68,
    publisher: 'Alianza Editorial',
    publishedYear: 2003,
  },
  '7-habitos-gente-altamente-efectiva': {
    pages: 432,
    publisher: 'Paidós',
    publishedYear: 1989,
  },
  'pensar-rapido-pensar-despacio': {
    pages: 512,
    publisher: 'Debate',
    publishedYear: 2011,
  },
  'sapiens-de-animales-a-dioses': {
    pages: 443,
    publisher: 'Debate',
    publishedYear: 2014,
  },
  'el-hombre-en-busca-de-sentido': {
    pages: 165,
    publisher: 'Herder',
    publishedYear: 1991,
  },
  'the-5-types-of-wealth': {
    pages: 272,
    publisher: 'Portfolio / Penguin',
    publishedYear: 2025,
  },
  'never-split-the-difference': {
    pages: 288,
    publisher: 'HarperBusiness',
    publishedYear: 2016,
  },
  'who-moved-my-cheese': {
    pages: 96,
    publisher: 'Putnam Adult',
    publishedYear: 1998,
  },
}

export function getBookMeta(slug: string): BookMeta | null {
  return META[slug] ?? null
}
