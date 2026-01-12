export type CheckoutPlan =
	| 'logistics_monthly'
	| 'logistics_annual'
	| 'contractor_annual'
	| 'verified_contractor_badge';

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
	return (
		value === 'logistics_monthly' ||
		value === 'logistics_annual' ||
		value === 'contractor_annual' ||
		value === 'verified_contractor_badge'
	);
}

export function getSuccessPathForPlan(plan: CheckoutPlan): string {
	if (plan === 'logistics_monthly' || plan === 'logistics_annual') return '/company';
	return '/jobs';
}

export function getCancelPathForPlan(plan: CheckoutPlan): string {
	if (plan === 'logistics_monthly' || plan === 'logistics_annual') return '/company';
	return '/contractor';
}
