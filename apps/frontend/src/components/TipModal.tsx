import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
				{
					duration: 10000,
				},
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
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={isProcessing}
					className="flex-1"
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={!stripe || isProcessing}
					className="flex-1"
				>
					{isProcessing ? (
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Processing...
						</div>
					) : (
						`💳 Pay €${(amount / 100).toFixed(2)}`
					)}
				</Button>
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
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-md max-h-[95vh] overflow-y-auto mx-4">
					<DialogHeader>
						<DialogTitle className="text-lg">💳 Complete Payment</DialogTitle>
						<DialogDescription className="text-sm">
							€{(finalAmount).toFixed(2)} tip for {performerName}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						<Elements
							stripe={stripePromise}
							options={{
								clientSecret,
								appearance: {
									theme: 'stripe',
									variables: {
										colorPrimary: 'hsl(var(--primary))',
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

						<div className="p-4 bg-muted rounded-lg">
							<p className="text-xs text-muted-foreground">
								<strong>🔒 Secure Payment:</strong> Your payment is processed securely by Stripe with Apple Pay, Google Pay, and card support.
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	// Show amount selection form
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md max-h-[95vh] overflow-y-auto mx-4 p-4 sm:p-6">
				<DialogHeader>
					<DialogTitle className="text-lg sm:text-xl">💰 Tip {performerName}</DialogTitle>
					<DialogDescription className="text-sm">
						Support this street performance
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Suggested Amounts */}
					<div>
						<Label className="text-sm font-medium mb-3 block">
							Choose Amount
						</Label>
						<div className="grid grid-cols-2 gap-2 sm:gap-3">
							{suggestedAmounts.map((amount) => (
								<Button
									key={amount}
									variant={selectedAmount === amount ? "default" : "outline"}
									onClick={() => handleAmountSelect(amount)}
									disabled={isLoading}
									className="p-3 h-12 sm:h-auto text-base sm:text-sm"
								>
									€{amount}
								</Button>
							))}
						</div>
					</div>

					{/* Custom Amount */}
					<div>
						<Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
							Or Enter Custom Amount
						</Label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-base">
								€
							</span>
							<Input
								id="custom-amount"
								type="number"
								value={customAmount}
								onChange={(e) => handleCustomAmountChange(e.target.value)}
								placeholder="5.00"
								min="0.50"
								max="100"
								step="0.50"
								className="pl-8 h-12 sm:h-auto text-base sm:text-sm"
								disabled={isLoading}
							/>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Minimum €0.50, Maximum €100.00
						</p>
					</div>

					{/* Public Message */}
					<div>
						<Label htmlFor="message" className="text-sm font-medium mb-2 block">
							Message (Optional)
						</Label>
						<Textarea
							id="message"
							value={publicMessage}
							onChange={(e) => setPublicMessage(e.target.value)}
							placeholder="Great performance! 🎵"
							maxLength={200}
							rows={3}
							className="resize-none"
							disabled={isLoading}
						/>
						<p className="text-xs text-muted-foreground mt-1">
							{publicMessage.length}/200 characters
						</p>
					</div>

					{/* Anonymous Toggle */}
					<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
						<div>
							<p className="text-sm font-medium">Anonymous Tip</p>
							<p className="text-xs text-muted-foreground">
								Hide your name from other users
							</p>
						</div>
						<Switch
							checked={isAnonymous}
							onCheckedChange={setIsAnonymous}
							disabled={isLoading}
						/>
					</div>

					{/* Amount Summary */}
					{amount && (
						<div className="p-4 bg-muted rounded-lg">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Tip Amount:</span>
								<span className="font-semibold">
									€{amount.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
								<span>Processing Fee:</span>
								<span>~€{(amount * 0.029 + 0.3).toFixed(2)}</span>
							</div>
							<div className="flex justify-between items-center text-xs text-muted-foreground">
								<span>Performer Receives:</span>
								<span>~€{(amount - (amount * 0.029 + 0.3)).toFixed(2)}</span>
							</div>
						</div>
					)}

					{/* Error Display */}
					{error && (
						<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Button
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
							className="flex-1 h-12 sm:h-auto text-base sm:text-sm"
						>
							Cancel
						</Button>
						<Button
							onClick={handleTip}
							disabled={!canTip}
							className="flex-1 h-12 sm:h-auto text-base sm:text-sm"
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									<span className="text-sm sm:text-base">Creating Payment...</span>
								</div>
							) : (
								`Continue to Payment →`
							)}
						</Button>
					</div>

					{/* Payment Info */}
					<div className="p-4 bg-muted rounded-lg">
						<p className="text-xs text-muted-foreground">
							<strong>🔒 Secure Payment:</strong> Next step will show secure payment options including Apple Pay, Google Pay, and card payments.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
