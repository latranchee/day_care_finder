<script lang="ts">
	import type { CommentWithDetails, VoteCounts } from '$lib/types';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import CommentItem from './CommentItem.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { formatDate as formatDateUtil } from '$lib/utils/formatting';

	interface User {
		id: number;
		name: string | null;
	}

	interface Props {
		comment: CommentWithDetails;
		user: User | null;
		daycareId: number;
		depth: number;
		onDeleted: () => void;
		onReplyAdded: () => void;
		onVoteUpdated: (commentId: number, counts: VoteCounts, userVote: -1 | 0 | 1) => void;
	}

	let { comment, user, daycareId, depth, onDeleted, onReplyAdded, onVoteUpdated }: Props = $props();

	const MAX_DEPTH = 4;
	let showReplyForm = $state(false);
	let replyContent = $state('');
	let isSubmittingReply = $state(false);
	let isDeleting = $state(false);
	let isVoting = $state(false);

	function formatDate(dateStr: string): string {
		const locale = getLocale() === 'fr' ? 'fr' : 'en';
		return formatDateUtil(dateStr, locale);
	}

	async function handleVote(vote: -1 | 1) {
		if (!user || isVoting) return;

		// If clicking the same vote, remove it (toggle)
		const newVote = comment.user_vote === vote ? 0 : vote;

		isVoting = true;
		try {
			const res = await fetch(`/api/comments/${comment.id}/vote`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vote: newVote })
			});

			if (res.ok) {
				const counts = await res.json() as VoteCounts;
				onVoteUpdated(comment.id, counts, newVote as -1 | 0 | 1);
			}
		} catch (e) {
			console.error('Failed to vote:', e);
		}
		isVoting = false;
	}

	async function submitReply() {
		if (!replyContent.trim() || isSubmittingReply || !user) return;

		isSubmittingReply = true;
		try {
			const res = await fetch(`/api/daycares/${daycareId}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: replyContent.trim(),
					parent_id: comment.id
				})
			});

			if (res.ok) {
				replyContent = '';
				showReplyForm = false;
				onReplyAdded();
			}
		} catch (e) {
			console.error('Failed to submit reply:', e);
		}
		isSubmittingReply = false;
	}

	async function deleteComment() {
		if (!confirm(m.confirm_delete_comment())) return;
		if (isDeleting) return;

		isDeleting = true;
		try {
			const res = await fetch(`/api/comments/${comment.id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				onDeleted();
			}
		} catch (e) {
			console.error('Failed to delete comment:', e);
		}
		isDeleting = false;
	}
</script>

<div class="comment" class:nested={depth > 0}>
	<div class="comment-header">
		<span class="author">{comment.is_deleted ? m.comment_deleted_user() : comment.author_name}</span>
		<span class="date">{formatDate(comment.created_at)}</span>
	</div>

	<div class="comment-content">
		{#if comment.is_deleted}
			<span class="deleted-content">{m.comment_deleted()}</span>
		{:else}
			{comment.content}
		{/if}
	</div>

	{#if !comment.is_deleted}
		<div class="comment-actions">
			<!-- Voting -->
			<div class="vote-buttons">
				<button
					class="vote-btn upvote"
					class:active={comment.user_vote === 1}
					onclick={() => handleVote(1)}
					disabled={!user || isVoting}
					title={m.vote_upvote()}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="18,15 12,9 6,15" />
					</svg>
				</button>
				<span class="vote-score" class:positive={comment.vote_score > 0} class:negative={comment.vote_score < 0}>
					{comment.vote_score}
				</span>
				<button
					class="vote-btn downvote"
					class:active={comment.user_vote === -1}
					onclick={() => handleVote(-1)}
					disabled={!user || isVoting}
					title={m.vote_downvote()}
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="6,9 12,15 18,9" />
					</svg>
				</button>
			</div>

			<!-- Reply button (if under max depth) -->
			{#if user && depth < MAX_DEPTH}
				<button class="action-btn" onclick={() => (showReplyForm = !showReplyForm)}>
					{m.btn_reply()}
				</button>
			{/if}

			<!-- Delete button (own comments only) -->
			{#if user && user.id === comment.user_id}
				<button class="action-btn delete-btn" onclick={deleteComment} disabled={isDeleting}>
					{#if isDeleting}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.btn_delete()}
					{/if}
				</button>
			{/if}
		</div>
	{/if}

	<!-- Reply form -->
	{#if showReplyForm}
		<div class="reply-form">
			<textarea bind:value={replyContent} rows="2" placeholder={m.placeholder_reply()}></textarea>
			<div class="reply-actions">
				<button class="btn btn-secondary btn-sm" onclick={() => (showReplyForm = false)}>
					{m.btn_cancel()}
				</button>
				<button
					class="btn btn-primary btn-sm"
					onclick={submitReply}
					disabled={!replyContent.trim() || isSubmittingReply}
				>
					{#if isSubmittingReply}
						<LoadingSpinner mode="inline" size="sm" showMessage={false} />
					{:else}
						{m.btn_post_reply()}
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Nested replies -->
	{#if comment.replies && comment.replies.length > 0}
		<div class="replies">
			{#each comment.replies as reply (reply.id)}
				<CommentItem
					comment={reply}
					{user}
					{daycareId}
					depth={depth + 1}
					{onDeleted}
					{onReplyAdded}
					{onVoteUpdated}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.comment {
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.comment.nested {
		margin-left: 1rem;
		border-left: 2px solid var(--accent);
		border-radius: 0 10px 10px 0;
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.author {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.date::before {
		content: '\2022';
		margin-right: 0.5rem;
	}

	.comment-content {
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin-bottom: 0.75rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.deleted-content {
		font-style: italic;
		color: var(--text-secondary);
	}

	.comment-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.vote-buttons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background: #f5f1eb;
		border-radius: 6px;
		padding: 0.125rem;
	}

	.vote-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		color: var(--text-secondary);
		transition: all 0.15s ease;
	}

	.vote-btn:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.05);
	}

	.vote-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.vote-btn svg {
		width: 16px;
		height: 16px;
	}

	.vote-btn.upvote.active {
		color: #22c55e;
	}

	.vote-btn.downvote.active {
		color: #ef4444;
	}

	.vote-score {
		font-size: 0.8rem;
		font-weight: 600;
		min-width: 1.5rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.vote-score.positive {
		color: #22c55e;
	}

	.vote-score.negative {
		color: #ef4444;
	}

	.action-btn {
		background: none;
		border: none;
		font-size: 0.8rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.action-btn:hover {
		background: #f5f1eb;
		color: var(--text-primary);
	}

	.action-btn.delete-btn:hover {
		color: #ef4444;
	}

	.reply-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.reply-form textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.85rem;
		resize: vertical;
		font-family: inherit;
		background: white;
	}

	.reply-form textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.reply-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.replies {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
