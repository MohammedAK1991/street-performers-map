import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";

interface PerformancePaymentSummary {
	totalTips: number;
	totalAmount: number;
	tipCount: number;
	averageTip: number;
}

interface RecentTip {
	amount: number;
	fromUser: string;
	message?: string;
	createdAt: string;
}

interface PerformancePaymentData {
	summary: PerformancePaymentSummary;
	recentTips: RecentTip[];
}

export function usePerformancePaymentSummary(performanceId: string | undefined) {
	return useQuery<PerformancePaymentData>({
		queryKey: ['performance-payment-summary', performanceId],
		queryFn: async () => {
			if (!performanceId) {
				throw new Error('Performance ID is required');
			}
			
			const response = await api.get(`/payments/performance/${performanceId}/summary`);
			return response.data.data;
		},
		enabled: !!performanceId,
		staleTime: 30000, // Consider data stale after 30 seconds
		refetchInterval: 60000, // Refetch every minute to keep tip count updated
	});
}
