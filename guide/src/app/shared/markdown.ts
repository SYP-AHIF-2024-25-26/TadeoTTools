import { marked } from 'marked';

/**
 * A description as Markdown (GFM, single line breaks kept); HTML in it passes through.
 * Angular's [innerHTML] sanitizer still strips scripts and handlers.
 */
export function descriptionHtml(description: string | undefined): string {
  return marked.parse(description ?? '', {
    async: false,
    gfm: true,
    breaks: true,
  });
}
