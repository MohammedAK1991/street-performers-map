import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";

interface TipModalProps {
	isOpen: boolean;
	onClose: () => void;
	performanceId: string;
	performerId: string;
	performerName: string;
}

interface CreateTipRequest {
	amount: number;
	performanceId: string;
	performerId: string;
	isAnonymous?: boolean;
	publicMessage?: string;
}

interface TipPaymentResult {
	transactionId: string;
	paymentIntentId: string;
	clientSecret: string;
	amount: number;
	processingFee: number;
	netAmount: number;
}

// Initialize Stripe outside component to prevent re-initialization
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

// Payment Form Component (wrapped with Elements)
function PaymentForm({ 
	clientSecret, 
	onClose, 
	performerName, 
	amount, 
	performanceId,
	queryClient 
}: {
	clientSecret: string;
	onClose: () => void;
	performerName: string;
	amount: number;
	performanceId: string;
	queryClient: any;
}) {
	const stripe = useStripe();
	const elements = useElements();
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			const { error: submitError } = await elements.submit();
			if (submitError) {
				throw new Error(submitError.message);
			}

			const { error: confirmError } = await stripe.confirmPayment({
				elements,
				clientSecret,
				confirmParams: {
					return_url: `${window.location.origin}/payment-success`,
				},
				redirect: 'if_required',
			});

			if (confirmError) {
				throw new Error(confirmError.message);
			}

			// Payment succeeded
			toast.success(
				`🎉 Tip sent successfully! Your tip of €${(amount / 100).toFixed(2)} has been sent to ${performerName}`,
			);

			// Invalidate queries to refresh data
			queryClient.invalidateQueries({ queryKey: ["performances"] });
			queryClient.invalidateQueries({ queryKey: ["earnings"] });
			queryClient.invalidateQueries({ queryKey: ["performance-payment-summary", performanceId] });
			
			onClose();
		} catch (err: any) {
			console.error("❌ Payment failed:", err);
			setError(err.message || "Payment failed");
			toast.error(err.message || "Something went wrong with your payment");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<PaymentElement 
					options={{
						layout: 'tabs',
						paymentMethodOrder: ['apple_pay', 'card'],
						fields: {
							billingDetails: 'auto'
						}
					}}
				/>
			</div>

			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onClose}
					className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
					disabled={isProcessing}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!stripe || isProcessing}
					className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
				>
					{isProcessing ? (
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Processing...
						</div>
					) : (
						`💳 Pay €${(amount / 100).toFixed(2)}`
					)}
				</button>
			</div>
		</form>
	);
}

export function TipModal({
	isOpen,
	onClose,
	performanceId,
	performerId,
	performerName,
}: TipModalProps) {
	const { user } = useUser();
	const queryClient = useQueryClient();

	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [customAmount, setCustomAmount] = useState("");
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [publicMessage, setPublicMessage] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [showPaymentForm, setShowPaymentForm] = useState(false);

	const suggestedAmounts = [1, 3, 5, 10];

	const createTipMutation = useMutation({
		mutationFn: async (
			request: CreateTipRequest,
		): Promise<TipPaymentResult> => {
			const response = await api.post("/payments/tip", request);
			return response.data.data;
		},
		onSuccess: (result) => {
			console.log("🎯 Payment intent created:", result);
			setClientSecret(result.clientSecret);
			setShowPaymentForm(true);
		},
		onError: (error: any) => {
			console.error("❌ Tip creation failed:", error);
			setError(error?.response?.data?.error?.message || "Failed to create tip");
			toast.error(
				error?.response?.data?.error?.message || "Failed to send tip",
			);
		},
	});

	const handleAmountSelect = (amount: number) => {
		setSelectedAmount(amount);
		setCustomAmount("");
		setError(null);
	};

	const handleCustomAmountChange = (value: string) => {
		setCustomAmount(value);
		setSelectedAmount(null);
		setError(null);
	};

	const getSelectedAmount = (): number | null => {
		if (selectedAmount !== null) return selectedAmount;
		if (customAmount) {
			const amount = Number.parseFloat(customAmount);
			return !Number.isNaN(amount) ? amount : null;
		}
		return null;
	};

	const handleTip = async () => {
		const amount = getSelectedAmount();

		if (!amount || amount < 0.5 || amount > 100) {
			setError("Tip amount must be between €0.50 and €100.00");
			return;
		}

		if (!user) {
			setError("Please sign in to send tips");
			return;
		}

		const request: CreateTipRequest = {
			amount,
			performanceId,
			performerId,
			isAnonymous,
			publicMessage: publicMessage.trim() || undefined,
		};

		createTipMutation.mutate(request);
	};

	const isLoading = createTipMutation.isPending;
	const amount = getSelectedAmount();
	const canTip = amount && amount >= 0.5 && amount <= 100 && !isLoading;

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedAmount(null);
			setCustomAmount("");
			setIsAnonymous(false);
			setPublicMessage("");
			setError(null);
			setClientSecret(null);
			setShowPaymentForm(false);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	// Show payment form if we have a client secret
	if (clientSecret && showPaymentForm) {
		const finalAmount = getSelectedAmount();
		if (!finalAmount) return null;

		return (
			<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
					{/* Header */}
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									💳 Complete Payment
								</h2>
								<p className="text-sm text-gray-600 mt-1">
									€{(finalAmount).toFixed(2)} tip for {performerName}
								</p>
							</div>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
							>
								×
							</button>
						</div>
					</div>

					{/* Payment Form */}
					<div className="p-6">
						<Elements 
							stripe={stripePromise} 
							options={{
								clientSecret,
								appearance: {
									theme: 'stripe',
									variables: {
										colorPrimary: '#2563eb',
									}
								}
							}}
						>
							<PaymentForm
								clientSecret={clientSecret}
								onClose={onClose}
								performerName={performerName}
								amount={Math.round(finalAmount * 100)} // Convert to cents
								performanceId={performanceId}
								queryClient={queryClient}
							/>
						</Elements>
					</div>

					{/* Payment Info */}
					<div className="p-4 bg-blue-50 border-t">
						<p className="text-xs text-blue-700">
							<strong>🔒 Secure Payment:</strong> Your payment is processed securely by Stripe with Apple Pay, Google Pay, and card support.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Show amount selection form
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="p-6 border-b">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								💰 Tip {performerName}
							</h2>
							<p className="text-sm text-gray-600 mt-1">
								Support this street performance
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
							disabled={isLoading}
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Suggested Amounts */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Choose Amount
						</label>
						<div className="grid grid-cols-2 gap-3">
							{suggestedAmounts.map((amount) => (
								<button
									key={amount}
									onClick={() => handleAmountSelect(amount)}
									className={`p-3 rounded-lg border-2 font-medium transition-colors ${
										selectedAmount === amount
											? "border-blue-600 bg-blue-50 text-blue-700"
											: "border-gray-300 hover:border-blue-300 text-gray-700"
									}`}
									disabled={isLoading}
								>
									€{amount}
								</button>
							))}
						</div>
					</div>

					{/* Custom Amount */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Or Enter Custom Amount
						</label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
								€
							</span>
							<input
								type="number"
								value={customAmount}
								onChange={(e) => handleCustomAmountChange(e.target.value)}
								placeholder="5.00"
								min="0.50"
								max="100"
								step="0.50"
								className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={isLoading}
							/>
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Minimum €0.50, Maximum €100.00
						</p>
					</div>

					{/* Public Message */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Message (Optional)
						</label>
						<textarea
							value={publicMessage}
							onChange={(e) => setPublicMessage(e.target.value)}
							placeholder="Great performance! 🎵"
							maxLength={200}
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
							disabled={isLoading}
						/>
						<p className="text-xs text-gray-500 mt-1">
							{publicMessage.length}/200 characters
						</p>
					</div>

					{/* Anonymous Toggle */}
					<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div>
							<p className="text-sm font-medium text-gray-700">Anonymous Tip</p>
							<p className="text-xs text-gray-500">
								Hide your name from other users
							</p>
						</div>
						<button
							onClick={() => setIsAnonymous(!isAnonymous)}
							className={`relative w-11 h-6 rounded-full transition-colors ${
								isAnonymous ? "bg-blue-600" : "bg-gray-300"
							}`}
							disabled={isLoading}
						>
							<span
								className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
									isAnonymous ? "translate-x-5" : "translate-x-0"
								}`}
							/>
						</button>
					</div>

					{/* Amount Summary */}
					{amount && (
						<div className="p-4 bg-blue-50 rounded-lg">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Tip Amount:</span>
								<span className="font-semibold text-gray-900">
									€{amount.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center text-xs text-gray-500 mt-1">
								<span>Processing Fee:</span>
								<span>~€{(amount * 0.029 + 0.3).toFixed(2)}</span>
							</div>
							<div className="flex justify-between items-center text-xs text-gray-500">
								<span>Performer Receives:</span>
								<span>~€{(amount - (amount * 0.029 + 0.3)).toFixed(2)}</span>
							</div>
						</div>
					)}

					{/* Error Display */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-700">{error}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleTip}
							disabled={!canTip}
							className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Creating Payment...
								</div>
							) : (
								`Continue to Payment →`
							)}
						</button>
					</div>
				</div>

				{/* Payment Info */}
				<div className="p-4 bg-blue-50 border-t">
					<p className="text-xs text-blue-700">
						<strong>🔒 Secure Payment:</strong> Next step will show secure payment options including Apple Pay, Google Pay, and card payments.
					</p>
				</div>
			</div>
		</div>
	);
}
