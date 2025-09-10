import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '@/services/notifications';
import { useUser } from '@clerk/clerk-react';

export function useNotifications() {
	const { user } = useUser();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	const updateNotifications = useCallback(() => {
		const all = notificationService.getAll();
		const unread = notificationService.getUnread();
		
		setNotifications(all);
		setUnreadCount(unread.length);
	}, []);

	useEffect(() => {
		// Initial load
		updateNotifications();

		// Subscribe to new notifications
		const unsubscribe = notificationService.subscribe(() => {
			updateNotifications();
		});

		// Connect to WebSocket if user is authenticated
		if (user?.id) {
			notificationService.connect(user.id);
			
			// Start simulating notifications in development
	
		}

		return () => {
			unsubscribe();
			notificationService.disconnect();
		};
	}, [user?.id, updateNotifications]);

	const markAsRead = useCallback((id: string) => {
		notificationService.markAsRead(id);
		updateNotifications();
	}, [updateNotifications]);

	const markAllAsRead = useCallback(() => {
		notificationService.markAllAsRead();
		updateNotifications();
	}, [updateNotifications]);

	const clearAll = useCallback(() => {
		notificationService.clearAll();
		updateNotifications();
	}, [updateNotifications]);

	return {
		notifications,
		unreadCount,
		markAsRead,
		markAllAsRead,
		clearAll,
	};
}