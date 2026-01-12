'use client';

import { useState } from 'react';

type Props = {
	label: string;
	returnPath: string;
	className?: string;
};

export function ManageBillingButton({ label, returnPath, className }: Props) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function go() {
		setError(null);
		setLoading(true);
		try {
			const origin = window.location.origin;
			const returnUrl = new URL(returnPath, origin).toString();

			const res = await fetch('/api/billing/portal', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ returnUrl }),
			});
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url) {
				setError(data.error ?? 'billing_unavailable');
				return;
			}
			window.location.assign(data.url);
		} catch {
			setError('billing_unavailable');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={go}
				disabled={loading}
				className={
					className ??
					'inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 disabled:opacity-50'
				}
			>
				{loading ? 'Opening…' : label}
			</button>
			{error ? <div className="text-xs text-red-700">{error}</div> : null}
		</div>
	);
}
