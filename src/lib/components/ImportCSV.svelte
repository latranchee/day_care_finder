<script lang="ts">
	interface Props {
		onImport: () => void;
		onClose: () => void;
	}

	let { onImport, onClose }: Props = $props();

	let fileInput: HTMLInputElement;
	let dragOver = $state(false);
	let importing = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleFile(file: File) {
		if (!file.name.endsWith('.csv')) {
			error = 'Please select a CSV file';
			return;
		}

		importing = true;
		error = '';
		success = '';

		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/import', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();

			if (res.ok) {
				success = `Successfully imported ${data.imported} daycares!`;
				onImport();
			} else {
				error = data.error || 'Import failed';
			}
		} catch (e) {
			error = 'Failed to import file';
		}

		importing = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file) handleFile(file);
	}

	function handleSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) handleFile(file);
	}
</script>

<div class="import-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation">
	<div class="import-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
		<button class="modal-close" onclick={onClose} aria-label="Close">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12" />
			</svg>
		</button>

		<h2 class="import-title">Import Daycares</h2>
		<p class="import-subtitle">Upload a CSV file with your daycare list</p>

		<div
			class="drop-zone"
			class:drag-over={dragOver}
			class:importing
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => dragOver = false}
			ondrop={handleDrop}
			onclick={() => fileInput.click()}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } }}
			role="button"
			tabindex="0"
		>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv"
				onchange={handleSelect}
				hidden
			/>

			{#if importing}
				<div class="spinner"></div>
				<p>Importing...</p>
			{:else}
				<svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				<p class="drop-text">Drop CSV file here or click to browse</p>
			{/if}
		</div>

		{#if error}
			<p class="message error">{error}</p>
		{/if}

		{#if success}
			<p class="message success">{success}</p>
		{/if}

		<div class="format-info">
			<h3>Expected CSV Format</h3>
			<code class="format-example">
name,address,phone,website,capacity,price,hours,age_range,rating
Happy Kids,123 Main St,555-1234,https://example.com,50,$1200/mo,7am-6pm,6mo-5yr,4.5
			</code>
			<p class="format-note">Only the <strong>name</strong> column is required. All other fields are optional.</p>
		</div>
	</div>
</div>

<style>
	.import-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(45, 35, 25, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.import-modal {
		--modal-bg: #fffcf8;
		--border-color: #e8dfd3;
		--text-primary: #3d3425;
		--text-secondary: #7a6d5c;
		--accent: #c47a4e;

		background: var(--modal-bg);
		border-radius: 20px;
		padding: 2rem;
		width: 100%;
		max-width: 520px;
		position: relative;
		box-shadow: 0 20px 40px rgba(45, 35, 25, 0.15);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--text-secondary);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background: rgba(0,0,0,0.05);
	}

	.modal-close svg {
		width: 20px;
		height: 20px;
	}

	.import-title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.import-subtitle {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
		font-size: 0.95rem;
	}

	.drop-zone {
		border: 2px dashed var(--border-color);
		border-radius: 12px;
		padding: 2.5rem 1.5rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #faf8f5;
	}

	.drop-zone:hover,
	.drop-zone.drag-over {
		border-color: var(--accent);
		background: #fdf9f5;
	}

	.drop-zone.importing {
		pointer-events: none;
		opacity: 0.7;
	}

	.upload-icon {
		width: 48px;
		height: 48px;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}

	.drop-text {
		color: var(--text-secondary);
		margin: 0;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 0.75rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.message {
		margin: 1rem 0 0 0;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
	}

	.message.error {
		background: #fae8e8;
		color: #a04444;
	}

	.message.success {
		background: #e8f5e8;
		color: #3d6b3d;
	}

	.format-info {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.format-info h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.format-example {
		display: block;
		background: #f5f0e8;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.75rem;
		overflow-x: auto;
		white-space: pre;
		color: var(--text-primary);
	}

	.format-note {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0.75rem 0 0 0;
	}
</style>
