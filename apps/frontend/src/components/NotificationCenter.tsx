import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/services/notifications';

export function NotificationCenter() {
	const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const formatTimestamp = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		
		return timestamp.toLocaleDateString();
	};

	const getNotificationIcon = (type: Notification['type']) => {
		switch (type) {
			case 'tip': return '💰';
			case 'like': return '❤️';
			case 'view': return '👀';
			case 'performance': return '🎭';
			case 'system': return '🔔';
			default: return '📢';
		}
	};

	const getNotificationColor = (type: Notification['type']) => {
		switch (type) {
			case 'tip': return 'border-green-500 bg-green-500/10';
			case 'like': return 'border-red-500 bg-red-500/10';
			case 'view': return 'border-blue-500 bg-blue-500/10';
			case 'performance': return 'border-purple-500 bg-purple-500/10';
			case 'system': return 'border-yellow-500 bg-yellow-500/10';
			default: return 'border-gray-500 bg-gray-500/10';
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Notification Bell Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
			>
				<span className="text-xl">🔔</span>
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{/* Notification Dropdown */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
					{/* Header */}
					<div className="px-4 py-3 border-b border-gray-700">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-white">Notifications</h3>
							{notifications.length > 0 && (
								<div className="flex space-x-2">
									{unreadCount > 0 && (
										<button
											onClick={markAllAsRead}
											className="text-xs text-blue-400 hover:text-blue-300"
										>
											Mark all read
										</button>
									)}
									<button
										onClick={clearAll}
										className="text-xs text-gray-400 hover:text-gray-300"
									>
										Clear all
									</button>
								</div>
							)}
						</div>
						{unreadCount > 0 && (
							<p className="text-xs text-gray-400 mt-1">
								{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
							</p>
						)}
					</div>

					{/* Notifications List */}
					<div className="max-h-80 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="px-4 py-8 text-center">
								<div className="text-4xl mb-2">📭</div>
								<p className="text-gray-400 text-sm">No notifications yet</p>
								<p className="text-gray-500 text-xs mt-1">
									You'll see tips, likes, and updates here
								</p>
							</div>
						) : (
							notifications.map((notification) => (
								<div
									key={notification.id}
									className={`px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors ${
										!notification.read ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : ''
									}`}
									onClick={() => {
										if (!notification.read) {
											markAsRead(notification.id);
										}
									}}
								>
									<div className="flex items-start space-x-3">
										{/* Notification Icon */}
										<div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
											{getNotificationIcon(notification.type)}
										</div>

										{/* Notification Content */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<h4 className={`text-sm font-medium truncate ${
													!notification.read ? 'text-white' : 'text-gray-300'
												}`}>
													{notification.title}
												</h4>
												<span className="text-xs text-gray-500 flex-shrink-0 ml-2">
													{formatTimestamp(notification.timestamp)}
												</span>
											</div>
											
											<p className={`text-sm mt-1 ${
												!notification.read ? 'text-gray-200' : 'text-gray-400'
											}`}>
												{notification.message}
											</p>

											{/* Additional data for specific notification types */}
											{notification.type === 'tip' && notification.data?.publicMessage && (
												<div className="mt-2 p-2 bg-gray-700/50 rounded text-xs text-gray-300 italic">
													"{notification.data.publicMessage}"
												</div>
											)}

											{!notification.read && (
												<div className="mt-2">
													<span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
												</div>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</div>

					{/* Footer */}
					{notifications.length > 0 && (
						<div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
							<button 
								onClick={() => setIsOpen(false)}
								className="w-full text-center text-xs text-gray-400 hover:text-gray-300 transition-colors"
							>
								Close notifications
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// Compact notification badge for mobile/small screens
export function NotificationBadge() {
	const { unreadCount } = useNotifications();

	if (unreadCount === 0) return null;

	return (
		<div className="relative">
			<span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		</div>
	);
}