import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * LaTeX rendering component using KaTeX
 * Supports both inline ($...$) and display ($$...$$) math
 */
function LaTeX({ children, display = false }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !children) return

    try {
      const text = String(children)

      // Render the text with LaTeX support
      const rendered = text.replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
        // Display math (block)
        try {
          return katex.renderToString(latex, { displayMode: true, throwOnError: false })
        } catch (e) {
          return match
        }
      }).replace(/\$([^\$]+)\$/g, (match, latex) => {
        // Inline math
        try {
          return katex.renderToString(latex, { displayMode: false, throwOnError: false })
        } catch (e) {
          return match
        }
      })

      containerRef.current.innerHTML = rendered
    } catch (error) {
      console.error('LaTeX rendering error:', error)
      containerRef.current.textContent = children
    }
  }, [children, display])

  return <span ref={containerRef} />
}

export default LaTeX
