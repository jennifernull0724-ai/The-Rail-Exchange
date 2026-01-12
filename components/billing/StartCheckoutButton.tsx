'use client';

import { useState } from 'react';

type Props = {
	role: 'contractor' | 'logistics';
	plan?: 'monthly' | 'annual';
	successPath: string;
	cancelPath: string;
	label: string;
	className?: string;
};

export function StartCheckoutButton({ role, plan, successPath, cancelPath, label, className }: Props) {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function startCheckout() {
		setError(null);
		setLoading(true);
		try {
			const origin = window.location.origin;
			const successUrl = new URL(successPath, origin).toString();
			const cancelUrl = new URL(cancelPath, origin).toString();

			const res = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ role, plan, successUrl, cancelUrl }),
			});

			const data = (await res.json()) as { url?: string; error?: string };

			if (!res.ok) {
				setError(data.error ?? 'billing_unavailable');
				return;
			}

			if (!data.url) {
				setError('billing_unavailable');
				return;
			}

			window.location.assign(data.url);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={startCheckout}
				disabled={loading}
				className={
					className ??
					'inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
				}
			>
				{loading ? 'Redirecting…' : label}
			</button>
			{error ? <div className="text-xs text-red-700">BLOCKED: {error}</div> : null}
		</div>
	);
}
