import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentService, type CreateTipRequest } from '../services/PaymentService';
import { Transaction } from '../entities/Transaction';
import { stripeService } from '../services/StripeService';

// Mock dependencies
vi.mock('../entities/Transaction');
vi.mock('../services/StripeService');

const mockTransaction = vi.mocked(Transaction);
const mockStripeService = vi.mocked(stripeService);

describe('PaymentService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Setup default mocks
		mockStripeService.createTipPaymentIntent = vi.fn();
		mockStripeService.confirmPayment = vi.fn();
		mockStripeService.getPaymentIntent = vi.fn();
		mockStripeService.getPaymentMethodTypes = vi.fn().mockImplementation((country: string) => {
			if (country?.toLowerCase() === 'netherlands') return ['card', 'ideal'];
			return ['card'];
		});
		mockTransaction.find = vi.fn();
		mockTransaction.findOne = vi.fn();
		mockTransaction.aggregate = vi.fn();
	});

	describe('createTip', () => {
		it('should create a tip with valid data', async () => {
			// Arrange
			const createTipRequest: CreateTipRequest = {
				amount: 5.00,
				performanceId: 'perf_123',
				performerId: 'performer_123',
				tipperId: 'tipper_123',
				currency: 'EUR',
				isAnonymous: false,
				publicMessage: 'Great performance!',
				location: {
					coordinates: [4.9041, 52.3676],
					city: 'Amsterdam',
					country: 'Netherlands'
				}
			};

			const mockPaymentResult = {
				paymentIntentId: 'pi_test_123',
				clientSecret: 'pi_test_123_secret',
				amount: 500,
				processingFee: 45,
				netAmount: 455
			};

			const mockTransactionDoc = {
				_id: 'trans_123',
				amount: 500,
				processingFee: 45,
				netAmount: 455,
				stripePaymentIntentId: 'pi_test_123',
				save: vi.fn().mockResolvedValue(true)
			};

			mockStripeService.createTipPaymentIntent.mockResolvedValue(mockPaymentResult);
			mockTransaction.mockImplementation(() => mockTransactionDoc);

			// Act
			const result = await paymentService.createTip(createTipRequest);

			// Assert
			expect(result).toEqual({
				transactionId: 'trans_123',
				paymentIntentId: 'pi_test_123',
				clientSecret: 'pi_test_123_secret',
				amount: 500,
				processingFee: 45,
				netAmount: 455
			});

			expect(mockStripeService.createTipPaymentIntent).toHaveBeenCalledWith({
				amount: 500,
				currency: 'EUR',
				performanceId: 'perf_123',
				performerId: 'performer_123',
				tipperId: 'tipper_123',
				isAnonymous: false,
				publicMessage: 'Great performance!',
				paymentMethodTypes: ['card', 'ideal']
			});
		});

		it('should handle anonymous tips correctly', async () => {
			// Arrange
			const createTipRequest: CreateTipRequest = {
				amount: 3.00,
				performanceId: 'perf_123',
				performerId: 'performer_123',
				currency: 'EUR',
				isAnonymous: true,
				location: {
					coordinates: [4.9041, 52.3676]
				}
			};

			const mockPaymentResult = {
				paymentIntentId: 'pi_test_123',
				clientSecret: 'pi_test_123_secret',
				amount: 300,
				processingFee: 39,
				netAmount: 261
			};

			const mockTransactionDoc = {
				_id: 'trans_123',
				amount: 300,
				processingFee: 39,
				netAmount: 261,
				stripePaymentIntentId: 'pi_test_123',
				save: vi.fn().mockResolvedValue(true)
			};

			mockStripeService.createTipPaymentIntent.mockResolvedValue(mockPaymentResult);
			mockTransaction.mockImplementation(() => mockTransactionDoc);

			// Act
			const result = await paymentService.createTip(createTipRequest);

			// Assert
			expect(mockStripeService.createTipPaymentIntent).toHaveBeenCalledWith({
				amount: 300,
				currency: 'EUR',
				performanceId: 'perf_123',
				performerId: 'performer_123',
				tipperId: undefined,
				isAnonymous: true,
				publicMessage: undefined,
				paymentMethodTypes: ['card']
			});

			expect(mockTransaction).toHaveBeenCalledWith({
				amount: 300,
				currency: 'EUR',
				fromUserId: undefined,
				toUserId: 'performer_123',
				performanceId: 'perf_123',
				stripePaymentIntentId: 'pi_test_123',
				stripeClientSecret: 'pi_test_123_secret',
				paymentMethod: 'card',
				status: 'pending',
				isAnonymous: true,
				publicMessage: undefined,
				processingFee: 39,
				netAmount: 261,
				location: {
					coordinates: [4.9041, 52.3676]
				},
				retryCount: 0,
				payoutStatus: 'pending'
			});
		});

		it('should throw error for invalid amount', async () => {
			// Arrange
			const createTipRequest: CreateTipRequest = {
				amount: 0.25, // Below minimum
				performanceId: 'perf_123',
				performerId: 'performer_123',
				currency: 'EUR'
			};

			// Act & Assert
			await expect(paymentService.createTip(createTipRequest)).rejects.toThrow(
				'Tip amount must be between €0.50 and €100.00'
			);
		});

		it('should throw error for amount above maximum', async () => {
			// Arrange
			const createTipRequest: CreateTipRequest = {
				amount: 150, // Above maximum
				performanceId: 'perf_123',
				performerId: 'performer_123',
				currency: 'EUR'
			};

			// Act & Assert
			await expect(paymentService.createTip(createTipRequest)).rejects.toThrow(
				'Tip amount must be between €0.50 and €100.00'
			);
		});
	});

	describe('updateTransactionStatus', () => {
		it('should update transaction status to completed', async () => {
			// Arrange
			const mockTransaction = {
				markCompleted: vi.fn().mockResolvedValue(true)
			};

			// Mock Transaction.findOne to return the mock transaction
			vi.mocked(Transaction.findOne).mockResolvedValue(mockTransaction as any);

			// Act
			await paymentService.updateTransactionStatus('pi_test_123', 'completed', 'ch_test_123');

			// Assert
			expect(Transaction.findOne).toHaveBeenCalledWith({
				stripePaymentIntentId: 'pi_test_123'
			});
			expect(mockTransaction.markCompleted).toHaveBeenCalledWith('ch_test_123');
		});

		it('should update transaction status to failed', async () => {
			// Arrange
			const mockTransaction = {
				markFailed: vi.fn().mockResolvedValue(true)
			};

			// Mock Transaction.findOne to return the mock transaction
			vi.mocked(Transaction.findOne).mockResolvedValue(mockTransaction as any);

			// Act
			await paymentService.updateTransactionStatus('pi_test_123', 'failed', undefined, 'Payment declined');

			// Assert
			expect(mockTransaction.markFailed).toHaveBeenCalledWith('Payment declined');
		});

		it('should handle transaction not found gracefully', async () => {
			// Arrange
			vi.mocked(Transaction.findOne).mockResolvedValue(null);

			// Act
			const result = await paymentService.updateTransactionStatus('pi_nonexistent', 'completed');

			// Assert - should not throw, just return undefined
			expect(result).toBeUndefined();
		});
	});

	describe('getPerformerEarnings', () => {
		it('should return performer earnings summary', async () => {
			// Arrange
			const mockEarningsData = [{
				_id: null,
				totalAmount: 2500,
				totalNet: 2200,
				totalFees: 300,
				transactionCount: 5,
				averageAmount: 500
			}];

			mockTransaction.getPerformerEarnings = vi.fn().mockResolvedValue(mockEarningsData);

			// Act
			const result = await paymentService.getPerformerEarnings('performer_123');

			// Assert
			expect(result).toEqual({
				_id: null,
				totalAmount: 2500,
				totalNet: 2200,
				totalFees: 300,
				transactionCount: 5,
				averageAmount: 500
			});

			expect(mockTransaction.getPerformerEarnings).toHaveBeenCalledWith(
				'performer_123',
				undefined,
				undefined
			);
		});

		it('should return zero values for performer with no earnings', async () => {
			// Arrange
			mockTransaction.getPerformerEarnings = vi.fn().mockResolvedValue([]);

			// Act
			const result = await paymentService.getPerformerEarnings('performer_new');

			// Assert
			expect(result).toEqual({
				totalAmount: 0,
				totalNet: 0,
				totalFees: 0,
				transactionCount: 0,
				averageAmount: 0
			});
		});

		it('should filter by date range', async () => {
			// Arrange
			const startDate = new Date('2024-01-01');
			const endDate = new Date('2024-12-31');
			
			mockTransaction.getPerformerEarnings = vi.fn().mockResolvedValue([{
				totalAmount: 1000,
				totalNet: 900,
				totalFees: 100,
				transactionCount: 2,
				averageAmount: 500
			}]);

			// Act
			await paymentService.getPerformerEarnings('performer_123', startDate, endDate);

			// Assert
			expect(mockTransaction.getPerformerEarnings).toHaveBeenCalledWith(
				'performer_123',
				startDate,
				endDate
			);
		});
	});

	describe('getPerformancePaymentSummary', () => {
		it('should return payment summary for performance', async () => {
			// Arrange
			const mockTransactions = [
				{ amount: 500, status: 'completed' },
				{ amount: 300, status: 'completed' }
			];

			mockTransaction.find = vi.fn().mockResolvedValue(mockTransactions);

			// Act
			const result = await paymentService.getPerformancePaymentSummary('perf_123');

			// Assert
			expect(result).toEqual({
				totalAmount: 800, // Only completed transactions
				totalTips: 800, // For backwards compatibility
				tipCount: 2,
				averageTip: 400
			});

			expect(mockTransaction.find).toHaveBeenCalledWith({
				performanceId: 'perf_123',
				status: 'completed'
			});
		});
	});
});