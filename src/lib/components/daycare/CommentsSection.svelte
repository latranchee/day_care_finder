<script lang="ts">
	import type { CommentWithDetails, VoteCounts } from '$lib/types';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import CommentItem from './CommentItem.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface User {
		id: number;
		name: string | null;
	}

	interface Props {
		daycareId: number;
		user: User | null;
	}

	let { daycareId, user }: Props = $props();

	let comments = $state<CommentWithDetails[]>([]);
	let newComment = $state('');
	let loading = $state(false);
	let isSubmitting = $state(false);
	let showCommentForm = $state(false);
	let error = $state<string | null>(null);

	function clearError() {
		error = null;
	}

	function setError(message: string) {
		error = message;
		setTimeout(() => (error = null), 5000);
	}

	$effect(() => {
		if (daycareId) {
			loadComments();
		}
	});

	async function loadComments() {
		loading = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/comments`);
			if (res.ok) {
				comments = await res.json();
			} else {
				setError(m.error_load_comments());
			}
		} catch (e) {
			console.error('Failed to load comments:', e);
			setError(m.error_load_comments());
		}
		loading = false;
	}

	async function submitComment() {
		if (!newComment.trim() || isSubmitting || !user) return;

		isSubmitting = true;
		clearError();
		try {
			const res = await fetch(`/api/daycares/${daycareId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newComment.trim() })
			});
			if (res.ok) {
				newComment = '';
				showCommentForm = false;
				await loadComments();
			} else {
				setError(m.error_add_comment());
			}
		} catch (e) {
			console.error('Failed to add comment:', e);
			setError(m.error_add_comment());
		}
		isSubmitting = false;
	}

	function handleCommentDeleted() {
		loadComments();
	}

	function handleReplyAdded() {
		loadComments();
	}

	function updateCommentVotes(commentList: CommentWithDetails[], commentId: number, newCounts: VoteCounts, newUserVote: -1 | 0 | 1): boolean {
		for (const comment of commentList) {
			if (comment.id === commentId) {
				comment.vote_score = newCounts.vote_score;
				comment.upvote_count = newCounts.upvote_count;
				comment.downvote_count = newCounts.downvote_count;
				comment.user_vote = newUserVote;
				return true;
			}
			if (comment.replies && comment.replies.length > 0) {
				if (updateCommentVotes(comment.replies, commentId, newCounts, newUserVote)) {
					return true;
				}
			}
		}
		return false;
	}

	function handleVoteUpdated(commentId: number, newCounts: VoteCounts, newUserVote: -1 | 0 | 1) {
		updateCommentVotes(comments, commentId, newCounts, newUserVote);
		comments = [...comments];
	}

	function countAllComments(commentList: CommentWithDetails[]): number {
		let count = commentList.length;
		for (const comment of commentList) {
			if (comment.replies && comment.replies.length > 0) {
				count += countAllComments(comment.replies);
			}
		}
		return count;
	}
</script>

<div class="section-header">
	<h3 class="comments-title">{m.section_comments({ count: countAllComments(comments) })}</h3>
	<p class="public-hint">{m.section_comments_hint()}</p>
</div>

{#if error}
	<p class="error-message">{error}</p>
{/if}

{#if user}
	{#if showCommentForm}
		<div class="comment-input">
			<textarea
				bind:value={newComment}
				placeholder={m.placeholder_add_comment()}
				rows="3"
			></textarea>
			<div class="comment-form-actions">
				<button
					class="btn btn-secondary btn-sm"
					onclick={() => {
						showCommentForm = false;
						newComment = '';
					}}
				>
					{m.btn_cancel()}
				</button>
				<button
					class="btn btn-primary btn-sm"
					onclick={submitComment}
					disabled={!newComment.trim() || isSubmitting}
				>
					{#if isSubmitting}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.btn_post_comment()}
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<button class="btn btn-secondary btn-sm add-comment-btn" onclick={() => (showCommentForm = true)}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			{m.btn_post_comment()}
		</button>
	{/if}
{:else}
	<p class="login-required">{m.comments_login_required()}</p>
{/if}

{#if loading}
	<div class="loading-state">
		<LoadingSpinner mode="inline" size="sm" />
		<span>{m.loading_comments()}</span>
	</div>
{:else if comments.length === 0}
	<p class="empty-state">{m.empty_comments()}</p>
{:else}
	<div class="comments-list">
		{#each comments as comment (comment.id)}
			<CommentItem
				{comment}
				{user}
				{daycareId}
				depth={0}
				onDeleted={handleCommentDeleted}
				onReplyAdded={handleReplyAdded}
				onVoteUpdated={handleVoteUpdated}
			/>
		{/each}
	</div>
{/if}

<style>
	.section-header {
		margin-bottom: 1rem;
	}

	.comments-title {
		font-family: 'DM Sans', system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.public-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0.25rem 0 0 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.public-hint::before {
		content: '🌐';
		font-size: 0.7rem;
	}

	.error-message {
		font-size: 0.85rem;
		color: #c44e4e;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.comment-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.comment-input textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
		background: white;
	}

	.comment-input textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.comment-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.add-comment-btn {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.add-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	.login-required {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: #f5f1eb;
		border-radius: 8px;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--text-secondary);
		font-size: 0.85rem;
	}

	.empty-state {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 1rem;
		background: #f5f1eb;
		border-radius: 8px;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
</style>
