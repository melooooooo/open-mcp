import { Client } from 'pg'

async function checkArticleMarkdown() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()

    // Get the article by slug
    const slug = '中国银行软件开发中心待遇大曝光'
    const result = await client.query(
      `SELECT id, title, slug, metadata FROM finance_experiences WHERE slug = $1`,
      [slug]
    )

    if (result.rows.length === 0) {
      console.log('Article not found')
      return
    }

    const experience = result.rows[0]
    console.log('Article ID:', experience.id)
    console.log('Title:', experience.title)
    console.log('Slug:', experience.slug)
    console.log('\n=== Markdown Source ===')

    if (experience.metadata?.markdown_source?.content) {
      const markdown = experience.metadata.markdown_source.content
      console.log('First 1000 characters:')
      console.log(markdown.substring(0, 1000))
      console.log('\n...')
      console.log('\nLast 500 characters:')
      console.log(markdown.substring(markdown.length - 500))
      console.log('\n\n=== Headings Found ===')

      // Extract all headings
      const headingRegex = /^#{1,6}\s+(.+)$/gm
      const headings = []
      let match
      while ((match = headingRegex.exec(markdown)) !== null) {
        headings.push(match[0])
      }
      console.log('Total headings:', headings.length)
      headings.forEach(h => console.log(h))
    } else {
      console.log('No markdown source found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

checkArticleMarkdown()
