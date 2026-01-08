<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';

	let { form } = $props();
	let loading = $state(false);
	let maxCommuteMinutes = $state(form?.maxCommuteMinutes ?? 5);
</script>

<svelte:head>
	<title>{m.signup_title()} - Daycare Finder</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>{m.signup_title()}</h1>

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
				<label for="name">{m.signup_name()}</label>
				<input
					type="text"
					id="name"
					name="name"
					value={form?.name ?? ''}
					placeholder={m.signup_name_placeholder()}
					autocomplete="name"
				/>
			</div>

			<div class="form-group">
				<label for="email">{m.label_email()} *</label>
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
				<label for="password">{m.signup_password()} *</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					autocomplete="new-password"
					minlength="6"
				/>
				<small class="hint">{m.signup_password_hint()}</small>
			</div>

			<div class="form-group">
				<label for="confirmPassword">{m.signup_confirm_password()} *</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					autocomplete="new-password"
				/>
			</div>

			<div class="form-divider">
				<span>{m.signup_location_section()}</span>
			</div>

			<div class="form-group">
				<label for="homeAddress">{m.settings_home_address()}</label>
				<input
					type="text"
					id="homeAddress"
					name="homeAddress"
					value={form?.homeAddress ?? ''}
					placeholder={m.settings_home_address_placeholder()}
				/>
				<small class="hint">{m.signup_address_hint()}</small>
			</div>

			<div class="form-group">
				<label for="maxCommuteMinutes">{m.signup_max_commute()} ({maxCommuteMinutes} min)</label>
				<input
					type="range"
					id="maxCommuteMinutes"
					name="maxCommuteMinutes"
					min="1"
					max="60"
					bind:value={maxCommuteMinutes}
				/>
				<div class="slider-labels">
					<span>1 min</span>
					<span>60 min</span>
				</div>
			</div>

			<button type="submit" class="btn btn-primary" disabled={loading}>
				{#if loading}
					{m.signup_creating()}
				{:else}
					{m.signup_submit()}
				{/if}
			</button>
		</form>

		<p class="auth-link">
			{m.signup_has_account()} <a href="/login">{m.signup_login_link()}</a>
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
		max-width: 450px;
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

	input[type="text"],
	input[type="email"],
	input[type="password"] {
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

	input[type="range"] {
		width: 100%;
		margin-top: 0.5rem;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.hint {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.form-divider {
		display: flex;
		align-items: center;
		margin: 1.5rem 0;
		color: var(--text-secondary);
		font-size: 0.85rem;
	}

	.form-divider::before,
	.form-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border-color);
	}

	.form-divider span {
		padding: 0 1rem;
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
</style>
