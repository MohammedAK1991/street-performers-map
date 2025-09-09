import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { paymentService } from '../services/PaymentService';
import { ApiError } from '../../../shared/utils/errors';

// Mock dependencies
vi.mock('../services/PaymentService');
vi.mock('../../../shared/utils/logger', () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn()
	}
}));

const mockPaymentService = paymentService as any;

describe('PaymentController', () => {
	let controller: PaymentController;
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: any;

	beforeEach(() => {
		controller = new PaymentController();
		
		mockReq = {
			body: {},
			params: {},
			query: {},
			user: { userId: 'user_123' },
			headers: {}
		};
		
		mockRes = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		
		mockNext = vi.fn();
		vi.clearAllMocks();
	});

	describe('createTip', () => {
		it('should create tip successfully', async () => {
			// Arrange
			mockReq.body = {
				amount: 5.00,
				performanceId: 'perf_123',
				performerId: 'performer_123',
				isAnonymous: false,
				publicMessage: 'Great show!'
			};

			const mockResult = {
				transactionId: 'trans_123',
				paymentIntentId: 'pi_test_123',
				clientSecret: 'pi_test_123_secret',
				amount: 500,
				processingFee: 45,
				netAmount: 455
			};

			mockPaymentService.createTip.mockResolvedValue(mockResult);

			// Act
			await controller.createTip(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockPaymentService.createTip).toHaveBeenCalledWith({
				amount: 5.00,
				performanceId: 'perf_123',
				performerId: 'performer_123',
				tipperId: 'user_123',
				isAnonymous: false,
				publicMessage: 'Great show!',
				currency: 'EUR',
				location: {
					coordinates: [0, 0],
					city: undefined,
					country: undefined
				}
			});

			expect(mockRes.status).toHaveBeenCalledWith(201);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockResult
			});
		});

		it('should handle missing required fields', async () => {
			// Arrange
			mockReq.body = {
				amount: 5.00
				// Missing performanceId and performerId
			};

			// Act
			await controller.createTip(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: false,
				error: {
					message: 'Missing required fields: amount, performanceId, performerId',
					code: undefined
				}
			});
		});

		it('should validate amount range', async () => {
			// Arrange
			mockReq.body = {
				amount: 0.25, // Below minimum
				performanceId: 'perf_123',
				performerId: 'performer_123'
			};

			// Act
			await controller.createTip(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: false,
				error: {
					message: 'Amount must be between €0.50 and €100.00',
					code: undefined
				}
			});
		});

		it('should extract location from headers', async () => {
			// Arrange
			mockReq.body = {
				amount: 5.00,
				performanceId: 'perf_123',
				performerId: 'performer_123'
			};
			
			mockReq.headers = {
				'cf-ipcity': 'Amsterdam',
				'cf-ipcountry': 'NL'
			};

			const mockResult = {
				transactionId: 'trans_123',
				paymentIntentId: 'pi_test_123',
				clientSecret: 'pi_test_123_secret',
				amount: 500,
				processingFee: 45,
				netAmount: 455
			};

			mockPaymentService.createTip.mockResolvedValue(mockResult);

			// Act
			await controller.createTip(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockPaymentService.createTip).toHaveBeenCalledWith(
				expect.objectContaining({
					location: {
						coordinates: [0, 0],
						city: 'Amsterdam',
						country: 'NL'
					}
				})
			);
		});
	});

	describe('getTransaction', () => {
		it('should return transaction for authorized user', async () => {
			// Arrange
			mockReq.params = { id: 'trans_123' };
			
			const mockTransaction = {
				_id: 'trans_123',
				amount: 500,
				fromUserId: 'user_123',
				toUserId: 'performer_123',
				status: 'completed'
			};

			mockPaymentService.getTransaction.mockResolvedValue(mockTransaction);

			// Act
			await controller.getTransaction(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockPaymentService.getTransaction).toHaveBeenCalledWith('trans_123');
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: mockTransaction
			});
		});

		it('should return 404 for non-existent transaction', async () => {
			// Arrange
			mockReq.params = { id: 'trans_nonexistent' };
			mockPaymentService.getTransaction.mockResolvedValue(null);

			// Act
			await controller.getTransaction(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.status).toHaveBeenCalledWith(404);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: false,
				error: {
					message: 'Transaction not found'
				}
			});
		});

		it('should return 403 for unauthorized access', async () => {
			// Arrange
			mockReq.params = { id: 'trans_123' };
			
			const mockTransaction = {
				_id: 'trans_123',
				fromUserId: 'other_user',
				toUserId: 'other_performer'
			};

			mockPaymentService.getTransaction.mockResolvedValue(mockTransaction);

			// Act
			await controller.getTransaction(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.status).toHaveBeenCalledWith(403);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: false,
				error: {
					message: 'Access denied'
				}
			});
		});
	});

	describe('getEarnings', () => {
		it('should return performer earnings', async () => {
			// Arrange
			const mockEarnings = {
				totalAmount: 2500,
				totalNet: 2200,
				totalFees: 300,
				transactionCount: 5,
				averageAmount: 500
			};

			const mockTransactions = [
				{ _id: 'trans_1', amount: 500 },
				{ _id: 'trans_2', amount: 300 }
			];

			mockPaymentService.getPerformerEarnings.mockResolvedValue(mockEarnings);
			mockPaymentService.getPerformerTransactions.mockResolvedValue(mockTransactions);

			// Act
			await controller.getEarnings(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockPaymentService.getPerformerEarnings).toHaveBeenCalledWith(
				'user_123',
				undefined,
				undefined
			);
			expect(mockPaymentService.getPerformerTransactions).toHaveBeenCalledWith(
				'user_123',
				'completed'
			);

			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: {
					earnings: mockEarnings,
					transactions: mockTransactions
				}
			});
		});

		it('should handle date range filtering', async () => {
			// Arrange
			mockReq.query = {
				startDate: '2024-01-01',
				endDate: '2024-12-31'
			};

			mockPaymentService.getPerformerEarnings.mockResolvedValue({});
			mockPaymentService.getPerformerTransactions.mockResolvedValue([]);

			// Act
			await controller.getEarnings(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockPaymentService.getPerformerEarnings).toHaveBeenCalledWith(
				'user_123',
				new Date('2024-01-01'),
				new Date('2024-12-31')
			);
		});

		it('should return 401 for unauthenticated user', async () => {
			// Arrange
			mockReq.user = undefined;

			// Act
			await controller.getEarnings(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				success: false,
				error: {
					message: 'Authentication required'
				}
			});
		});
	});

	describe('getPaymentConfig', () => {
		it('should return payment configuration', async () => {
			// Arrange
			const mockConfig = {
				currency: 'EUR',
				paymentMethods: ['card', 'apple_pay'],
				isConfigured: true,
				minAmount: 0.5,
				maxAmount: 100,
				suggestedAmounts: [1, 3, 5, 10]
			};

			// Mock the stripe service methods
			vi.doMock('../services/StripeService', () => ({
				stripeService: {
					getPaymentMethodTypes: vi.fn().mockReturnValue(['card', 'apple_pay']),
					isConfigured: vi.fn().mockReturnValue(true)
				}
			}));

			// Act
			await controller.getPaymentConfig(mockReq as Request, mockRes as Response);

			// Assert
			expect(mockRes.json).toHaveBeenCalledWith({
				success: true,
				data: expect.objectContaining({
					currency: 'EUR',
					minAmount: 0.5,
					maxAmount: 100,
					suggestedAmounts: [1, 3, 5, 10]
				})
			});
		});

		it('should use country from headers', async () => {
			// Arrange
			mockReq.headers = {
				'cf-ipcountry': 'DE'
			};

			// Act
			await controller.getPaymentConfig(mockReq as Request, mockRes as Response);

			// Assert - The controller should process the country header
			expect(mockRes.json).toHaveBeenCalled();
		});
	});
});