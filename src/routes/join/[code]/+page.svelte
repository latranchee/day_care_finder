<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import * as m from '$lib/paraglide/messages.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>{m.join_title()}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="join-page">
	<div class="join-card">
		<div class="icon">👶</div>

		{#if data.error === 'invalid'}
			<h1 class="title error">{m.join_error_invalid()}</h1>
			<p class="description">{m.join_error_invalid_desc()}</p>
			<a href="/" class="btn btn-primary">{m.join_go_home()}</a>

		{:else if data.error === 'expired'}
			<h1 class="title error">{m.join_error_expired()}</h1>
			<p class="description">{m.join_error_expired_desc({ name: data.childName || '' })}</p>
			<a href="/" class="btn btn-primary">{m.join_go_home()}</a>

		{:else if data.error === 'used'}
			<h1 class="title error">{m.join_error_used()}</h1>
			<p class="description">{m.join_error_used_desc()}</p>
			<a href="/" class="btn btn-primary">{m.join_go_home()}</a>

		{:else if form?.error}
			<h1 class="title error">{m.join_error_claim()}</h1>
			<p class="description">{form.error}</p>
			<a href="/" class="btn btn-primary">{m.join_go_home()}</a>

		{:else}
			<h1 class="title">{m.join_title()}</h1>
			<p class="description">
				{m.join_description({ childName: data.childName || '' })}
			</p>

			{#if !data.isLoggedIn}
				<p class="login-notice">{m.join_login_required()}</p>
				<a href="/login?redirect=/join/{data.code}" class="btn btn-primary">
					{m.auth_login()}
				</a>
				<p class="signup-link">
					{m.join_no_account()}
					<a href="/signup?redirect=/join/{data.code}">{m.auth_signup()}</a>
				</p>
			{:else}
				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}
							<LoadingSpinner mode="inline" size="sm" showMessage={false} />
						{:else}
							{m.join_button()}
						{/if}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</div>

<style>
	.join-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f5f0e8 0%, #ebe5db 100%);
		padding: 2rem;
		font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
	}

	.join-card {
		background: white;
		border-radius: 20px;
		padding: 3rem;
		max-width: 420px;
		width: 100%;
		text-align: center;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	.icon {
		font-size: 3rem;
		margin-bottom: 1.5rem;
	}

	.title {
		font-family: 'Source Serif 4', Georgia, serif;
		font-size: 1.75rem;
		font-weight: 600;
		color: #3d3425;
		margin: 0 0 1rem 0;
	}

	.title.error {
		color: #c44e4e;
	}

	.description {
		color: #5a4d3d;
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 1.5rem 0;
	}

	.login-notice {
		font-size: 0.9rem;
		color: #7a6d5c;
		margin-bottom: 1rem;
	}

	.signup-link {
		margin-top: 1rem;
		font-size: 0.9rem;
		color: #7a6d5c;
	}

	.signup-link a {
		color: #c47a4e;
		text-decoration: none;
		font-weight: 500;
	}

	.signup-link a:hover {
		text-decoration: underline;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		border: none;
	}

	.btn-primary {
		background: #c47a4e;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #b36a42;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		background: #d8cfc4;
		cursor: not-allowed;
	}

	form {
		display: contents;
	}
</style>
