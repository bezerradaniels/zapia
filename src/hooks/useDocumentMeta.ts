import { useEffect } from 'react'

type DocumentMeta = {
  title: string
  description?: string
}

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Vite is a static SPA with a single index.html, so route-level <title> and
// meta description changes happen client-side via this hook instead of a
// head-management library.
export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content')

    document.title = title
    if (description) setMetaDescription(description)

    return () => {
      document.title = previousTitle
      if (description && previousDescription) {
        setMetaDescription(previousDescription)
      }
    }
  }, [title, description])
}
