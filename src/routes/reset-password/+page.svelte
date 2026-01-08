<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let token = $derived($page.url.searchParams.get('token') || '');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let validating = $state(true);
	let tokenValid = $state(false);
	let userEmail = $state('');
	let errorMessage = $state('');
	let success = $state(false);

	// Validate token on mount
	$effect(() => {
		if (token) {
			validateToken();
		} else {
			validating = false;
			errorMessage = m.reset_password_invalid_token();
		}
	});

	async function validateToken() {
		try {
			const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
			const data = await response.json();

			if (response.ok && data.valid) {
				tokenValid = true;
				userEmail = data.email || '';
			} else {
				errorMessage = data.error || m.reset_password_invalid_token();
			}
		} catch {
			errorMessage = m.reset_password_error();
		} finally {
			validating = false;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		errorMessage = '';

		if (password !== confirmPassword) {
			errorMessage = m.reset_password_mismatch();
			return;
		}

		if (password.length < 6) {
			errorMessage = m.signup_password_hint();
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password })
			});

			const data = await response.json();

			if (response.status === 429) {
				errorMessage = m.reset_password_rate_limit();
			} else if (!response.ok || !data.success) {
				errorMessage = data.error || m.reset_password_error();
			} else {
				success = true;
				// Redirect to login after 3 seconds
				setTimeout(() => goto('/login'), 3000);
			}
		} catch {
			errorMessage = m.reset_password_error();
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.reset_password_title()} - GarderieFacile.com</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>{m.reset_password_title()}</h1>

		{#if validating}
			<div class="loading-state">
				<LoadingSpinner mode="standalone" size="md" showMessage={false} />
				<p>{m.reset_password_validating()}</p>
			</div>
		{:else if success}
			<div class="success-message">
				<p>{m.reset_password_success()}</p>
				<p class="hint">{m.reset_password_redirect()}</p>
			</div>
			<a href="/login" class="btn btn-primary">{m.forgot_password_back_to_login()}</a>
		{:else if !tokenValid}
			<div class="error-state">
				<div class="error-message">{errorMessage}</div>
				<p>{m.reset_password_try_again()}</p>
				<a href="/forgot-password" class="btn btn-primary">{m.reset_password_request_new()}</a>
			</div>
		{:else}
			{#if userEmail}
				<p class="description">{m.reset_password_for_email({ email: userEmail })}</p>
			{/if}

			<form onsubmit={handleSubmit}>
				{#if errorMessage}
					<div class="error-message">{errorMessage}</div>
				{/if}

				<div class="form-group">
					<label for="password">{m.reset_password_new_password()}</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						required
						autocomplete="new-password"
						minlength="6"
					/>
					<small class="hint">{m.signup_password_hint()}</small>
				</div>

				<div class="form-group">
					<label for="confirmPassword">{m.reset_password_confirm()}</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						bind:value={confirmPassword}
						required
						autocomplete="new-password"
					/>
				</div>

				<button type="submit" class="btn btn-primary" disabled={loading}>
					{#if loading}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
						{m.reset_password_updating()}
					{:else}
						{m.reset_password_submit()}
					{/if}
				</button>
			</form>
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

	.loading-state {
		text-align: center;
		padding: 2rem 0;
	}

	.loading-state p {
		margin-top: 1rem;
		color: var(--text-secondary);
	}

	.error-state {
		text-align: center;
	}

	.error-state p {
		color: var(--text-secondary);
		margin: 1rem 0;
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

	.hint {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
</style>
