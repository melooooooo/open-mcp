import { createClient } from '@supabase/supabase-js'

async function checkArticleMarkdown() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const slug = '中国银行软件开发中心待遇大曝光'
    const { data, error } = await supabase
      .from('finance_experiences')
      .select('id, title, slug, metadata, content_html')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching article:', error)
      return
    }

    if (!data) {
      console.log('Article not found')
      return
    }

    console.log('Article ID:', data.id)
    console.log('Title:', data.title)
    console.log('Slug:', data.slug)
    console.log('\n=== Markdown Source ===')

    if (data.metadata?.markdown_source?.content) {
      const markdown = data.metadata.markdown_source.content
      console.log('Total length:', markdown.length)
      console.log('\nFirst 1000 characters:')
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
      if (headings.length > 0) {
        headings.forEach(h => console.log(h))
      } else {
        console.log('No headings found!')
      }
    } else {
      console.log('No markdown source found')
      console.log('\n=== Content HTML Preview ===')
      if (data.content_html) {
        console.log(data.content_html.substring(0, 500))
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkArticleMarkdown()
