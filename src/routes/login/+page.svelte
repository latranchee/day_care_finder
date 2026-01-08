<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>{m.login_title()} - GarderieFacile.com</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>{m.login_title()}</h1>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			{#if form?.error}
				<div class="error-message">{form.error}</div>
			{/if}

			<div class="form-group">
				<label for="email">{m.label_email()}</label>
				<input
					type="email"
					id="email"
					name="email"
					value={form?.email ?? ''}
					required
					autocomplete="email"
				/>
			</div>

			<div class="form-group">
				<label for="password">{m.login_password()}</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					autocomplete="current-password"
				/>
				<a href="/forgot-password" class="forgot-password-link">{m.login_forgot_password()}</a>
			</div>

			<button type="submit" class="btn btn-primary" disabled={loading}>
				{#if loading}
					<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{m.login_logging_in()}
				{:else}
					{m.login_submit()}
				{/if}
			</button>

			{#if loading}
				<div class="loading-funny">
					<LoadingSpinner mode="standalone" size="sm" showMessage={true} messageInterval={1500} />
				</div>
			{/if}
		</form>

		<p class="auth-link">
			{m.login_no_account()} <a href="/signup">{m.login_signup_link()}</a>
		</p>
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
		margin: 0 0 1.5rem;
		font-size: 1.5rem;
		text-align: center;
		color: var(--text-primary);
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

	.loading-funny {
		margin-top: 1rem;
		text-align: center;
		padding: 0.75rem;
		background: var(--background);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.forgot-password-link {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: var(--accent);
		text-decoration: none;
	}

	.forgot-password-link:hover {
		text-decoration: underline;
	}
</style>
