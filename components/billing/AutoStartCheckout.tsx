'use client';

import { useEffect, useState } from 'react';

type Props = {
	role: 'contractor' | 'logistics';
	plan?: 'monthly' | 'annual';
	successPath: string;
	cancelPath: string;
};

export function AutoStartCheckout({ role, plan, successPath, cancelPath }: Props) {
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function run() {
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
				if (!res.ok || !data.url) {
					if (!cancelled) setError(data.error ?? 'billing_unavailable');
					return;
				}
				window.location.assign(data.url);
			} catch {
				if (!cancelled) setError('billing_unavailable');
			}
		}
		run();
		return () => {
			cancelled = true;
		};
	}, [role, plan, successPath, cancelPath]);

	if (!error) return null;
	return <div className="text-xs text-red-700">{error}</div>;
}
