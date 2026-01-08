<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();

	// Configure marked for safe defaults
	marked.setOptions({
		breaks: true, // Convert \n to <br>
		gfm: true // GitHub Flavored Markdown
	});

	function renderMarkdown(text: string): string {
		const html = marked.parse(text, { async: false }) as string;
		return DOMPurify.sanitize(html, {
			ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			ALLOWED_ATTR: ['href', 'target', 'rel']
		});
	}

	let rendered = $derived(renderMarkdown(content));
</script>

<div class="markdown-content">
	{@html rendered}
</div>

<style>
	.markdown-content {
		font-size: 0.9rem;
		color: var(--text-primary, #3d3425);
		line-height: 1.5;
	}

	.markdown-content :global(p) {
		margin: 0 0 0.5rem 0;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.markdown-content :global(a) {
		color: var(--accent, #c47a4e);
		text-decoration: none;
	}

	.markdown-content :global(a:hover) {
		text-decoration: underline;
	}

	.markdown-content :global(strong) {
		font-weight: 600;
	}

	.markdown-content :global(code) {
		font-family: 'SF Mono', Consolas, monospace;
		font-size: 0.85em;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.markdown-content :global(pre) {
		background: rgba(0, 0, 0, 0.05);
		padding: 0.75rem;
		border-radius: 8px;
		overflow-x: auto;
		margin: 0.5rem 0;
	}

	.markdown-content :global(pre code) {
		background: none;
		padding: 0;
	}

	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.markdown-content :global(li) {
		margin: 0.25rem 0;
	}

	.markdown-content :global(blockquote) {
		margin: 0.5rem 0;
		padding-left: 1rem;
		border-left: 3px solid var(--border-color, #e8dfd3);
		color: var(--text-secondary, #7a6d5c);
	}

	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3),
	.markdown-content :global(h4),
	.markdown-content :global(h5),
	.markdown-content :global(h6) {
		margin: 0.75rem 0 0.5rem 0;
		font-weight: 600;
		line-height: 1.3;
	}

	.markdown-content :global(h1) { font-size: 1.25rem; }
	.markdown-content :global(h2) { font-size: 1.125rem; }
	.markdown-content :global(h3) { font-size: 1rem; }
	.markdown-content :global(h4),
	.markdown-content :global(h5),
	.markdown-content :global(h6) { font-size: 0.9rem; }
</style>
