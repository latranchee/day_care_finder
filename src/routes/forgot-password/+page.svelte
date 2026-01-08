<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let email = $state('');
	let loading = $state(false);
	let submitted = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			if (response.status === 429) {
				errorMessage = m.forgot_password_rate_limit();
			} else if (!response.ok) {
				const data = await response.json();
				errorMessage = data.error || m.forgot_password_error();
			} else {
				submitted = true;
			}
		} catch {
			errorMessage = m.forgot_password_error();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.forgot_password_title()} - GarderieFacile.com</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>{m.forgot_password_title()}</h1>

		{#if submitted}
			<div class="success-message">
				<p>{m.forgot_password_success()}</p>
				<p class="hint">{m.forgot_password_check_email()}</p>
			</div>
			<a href="/login" class="btn btn-primary">{m.forgot_password_back_to_login()}</a>
		{:else}
			<p class="description">{m.forgot_password_description()}</p>

			<form onsubmit={handleSubmit}>
				{#if errorMessage}
					<div class="error-message">{errorMessage}</div>
				{/if}

				<div class="form-group">
					<label for="email">{m.label_email()}</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						required
						autocomplete="email"
						placeholder={m.forgot_password_email_placeholder()}
					/>
				</div>

				<button type="submit" class="btn btn-primary" disabled={loading}>
					{#if loading}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
						{m.forgot_password_sending()}
					{:else}
						{m.forgot_password_submit()}
					{/if}
				</button>
			</form>

			<p class="auth-link">
				{m.forgot_password_remember()} <a href="/login">{m.forgot_password_login_link()}</a>
			</p>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #f5f0e8 0%, #ebe5db 100%);
	}

	.auth-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		text-align: center;
		color: var(--text-primary);
	}

	.description {
		text-align: center;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 1rem;
		background: var(--background);
		color: var(--text-primary);
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(139, 119, 101, 0.2);
	}

	.btn {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		margin-top: 0.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		text-decoration: none;
	}

	.btn-primary {
		background: var(--accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		background: #fee;
		color: #c00;
		padding: 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.success-message {
		background: #efe;
		color: #060;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		text-align: center;
	}

	.success-message p {
		margin: 0;
	}

	.success-message .hint {
		font-size: 0.85rem;
		margin-top: 0.5rem;
		opacity: 0.8;
	}

	.auth-link {
		margin-top: 1.5rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.auth-link a {
		color: var(--accent);
		text-decoration: none;
	}

	.auth-link a:hover {
		text-decoration: underline;
	}

	.hint {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
</style>
