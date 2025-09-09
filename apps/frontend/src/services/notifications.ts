import { toast } from 'react-hot-toast';

export interface Notification {
	id: string;
	type: 'tip' | 'like' | 'view' | 'performance' | 'system';
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	data?: any;
}

export interface TipNotification extends Notification {
	type: 'tip';
	data: {
		amount: number;
		performanceId: string;
		performanceTitle: string;
		fromUser?: string;
		isAnonymous: boolean;
		publicMessage?: string;
	};
}

export interface LikeNotification extends Notification {
	type: 'like';
	data: {
		performanceId: string;
		performanceTitle: string;
		fromUser: string;
	};
}

export interface PerformanceNotification extends Notification {
	type: 'performance';
	data: {
		performanceId: string;
		status: 'started' | 'ended' | 'cancelled';
		title: string;
	};
}

class NotificationService {
	private notifications: Notification[] = [];
	private listeners: ((notification: Notification) => void)[] = [];
	private socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	constructor() {
		this.loadFromStorage();
	}

	// Initialize WebSocket connection for real-time notifications
	connect(userId: string) {
		const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
		
		try {
			this.socket = new WebSocket(`${wsUrl}?userId=${userId}`);
			
			this.socket.onopen = () => {
				console.log('🔔 Notifications WebSocket connected');
				this.reconnectAttempts = 0;
			};

			this.socket.onmessage = (event) => {
				try {
					const notification: Notification = JSON.parse(event.data);
					this.addNotification(notification);
				} catch (error) {
					console.error('Failed to parse notification:', error);
				}
			};

			this.socket.onclose = () => {
				console.log('🔔 Notifications WebSocket disconnected');
				this.attemptReconnect(userId);
			};

			this.socket.onerror = (error) => {
				console.error('🔔 WebSocket error:', error);
			};

		} catch (error) {
			console.error('Failed to connect to notifications WebSocket:', error);
		}
	}

	private attemptReconnect(userId: string) {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
			
			setTimeout(() => {
				console.log(`🔔 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
				this.connect(userId);
			}, delay);
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}

	// Add notification and trigger listeners
	private addNotification(notification: Notification) {
		this.notifications.unshift(notification);
		
		// Keep only last 100 notifications
		if (this.notifications.length > 100) {
			this.notifications = this.notifications.slice(0, 100);
		}

		this.saveToStorage();
		this.notifyListeners(notification);
		this.showToast(notification);
	}

	// Show toast notification
	private showToast(notification: Notification) {
		const toastOptions = {
			duration: 5000,
			position: 'top-right' as const,
		};

		switch (notification.type) {
			case 'tip': {
				const tipData = (notification as TipNotification).data;
				toast.success(
					`💰 New tip received: €${(tipData.amount / 100).toFixed(2)}${
						tipData.publicMessage ? `\n"${tipData.publicMessage}"` : ''
					}`,
					toastOptions
				);
				break;
			}

			case 'like':
				toast.success(`❤️ ${notification.message}`, toastOptions);
				break;

			case 'view':
				toast.success(`👀 ${notification.message}`, toastOptions);
				break;

			case 'performance': {
				const perfData = (notification as PerformanceNotification).data;
				const icon = perfData.status === 'started' ? '🎬' : perfData.status === 'ended' ? '🎭' : '⚠️';
				toast(`${icon} ${notification.message}`, toastOptions);
				break;
			}

			case 'system':
				toast(notification.message, {
					...toastOptions,
					icon: '🔔',
				});
				break;

			default:
				toast(notification.message, toastOptions);
		}
	}

	// Mock notifications for development
	createMockTipNotification(amount: number, performanceTitle: string): TipNotification {
		return {
			id: `tip_${Date.now()}`,
			type: 'tip',
			title: 'New Tip Received!',
			message: `You received a €${(amount / 100).toFixed(2)} tip for "${performanceTitle}"`,
			timestamp: new Date(),
			read: false,
			data: {
				amount,
				performanceId: 'perf_123',
				performanceTitle,
				isAnonymous: Math.random() > 0.5,
				publicMessage: Math.random() > 0.5 ? 'Great performance! 🎵' : undefined,
			}
		};
	}

	createMockLikeNotification(performanceTitle: string): LikeNotification {
		return {
			id: `like_${Date.now()}`,
			type: 'like',
			title: 'New Like!',
			message: `Someone liked your performance "${performanceTitle}"`,
			timestamp: new Date(),
			read: false,
			data: {
				performanceId: 'perf_123',
				performanceTitle,
				fromUser: 'Music Lover'
			}
		};
	}

	// Simulate receiving notifications (for development)
	simulateNotifications() {
		const performances = [
			'Jazz at Central Park',
			'Rock in Times Square', 
			'Acoustic at Brooklyn Bridge',
			'Blues at Washington Square'
		];

		setInterval(() => {
			if (Math.random() > 0.7) { // 30% chance every 10 seconds
				const performance = performances[Math.floor(Math.random() * performances.length)];
				
				if (Math.random() > 0.6) {
					// Tip notification
					const amount = [100, 200, 300, 500, 1000][Math.floor(Math.random() * 5)];
					this.addNotification(this.createMockTipNotification(amount, performance));
				} else {
					// Like notification
					this.addNotification(this.createMockLikeNotification(performance));
				}
			}
		}, 10000); // Every 10 seconds
	}

	// Get all notifications
	getAll(): Notification[] {
		return [...this.notifications];
	}

	// Get unread notifications
	getUnread(): Notification[] {
		return this.notifications.filter(n => !n.read);
	}

	// Mark notification as read
	markAsRead(id: string) {
		const notification = this.notifications.find(n => n.id === id);
		if (notification) {
			notification.read = true;
			this.saveToStorage();
		}
	}

	// Mark all notifications as read
	markAllAsRead() {
		this.notifications.forEach(n => n.read = true);
		this.saveToStorage();
	}

	// Clear all notifications
	clearAll() {
		this.notifications = [];
		this.saveToStorage();
	}

	// Subscribe to notifications
	subscribe(listener: (notification: Notification) => void) {
		this.listeners.push(listener);
		
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	private notifyListeners(notification: Notification) {
		this.listeners.forEach(listener => {
			try {
				listener(notification);
			} catch (error) {
				console.error('Error in notification listener:', error);
			}
		});
	}

	private saveToStorage() {
		try {
			localStorage.setItem('spm_notifications', JSON.stringify(this.notifications));
		} catch (error) {
			console.error('Failed to save notifications to storage:', error);
		}
	}

	private loadFromStorage() {
		try {
			const stored = localStorage.getItem('spm_notifications');
			if (stored) {
				this.notifications = JSON.parse(stored).map((n: any) => ({
					...n,
					timestamp: new Date(n.timestamp)
				}));
			}
		} catch (error) {
			console.error('Failed to load notifications from storage:', error);
		}
	}

	// Request permission for browser notifications
	async requestPermission(): Promise<boolean> {
		if (!('Notification' in window)) {
			console.warn('Browser does not support notifications');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission === 'denied') {
			return false;
		}

		const permission = await Notification.requestPermission();
		return permission === 'granted';
	}

	// Browser notification functionality can be added here when needed
}

// Export singleton instance
export const notificationService = new NotificationService();