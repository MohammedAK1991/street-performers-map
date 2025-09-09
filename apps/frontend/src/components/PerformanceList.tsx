import type { Performance } from "@spm/shared-types";

interface PerformanceListProps {
	performances: Performance[];
	onClose: () => void;
	onPerformanceClick: (performance: Performance) => void;
}

export function PerformanceList({
	performances,
	onClose,
	onPerformanceClick,
}: PerformanceListProps) {
	const formatTime = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		}).format(date);
	};

	const getStatusText = (performance: Performance) => {
		const currentStop =
			performance.route.stops.find((stop) => stop.status === "active") ||
			performance.route.stops[0];

		switch (performance.status) {
			case "live":
				return `Live Now • Ends at ${formatTime(new Date(currentStop.endTime))}`;
			case "scheduled": {
				const startTime = new Date(currentStop.startTime);
				const minutesUntil = Math.round(
					(startTime.getTime() - Date.now()) / (1000 * 60),
				);
				if (minutesUntil < 60) {
					return `Starting in ${minutesUntil} minutes`;
				}
				return `Today at ${formatTime(startTime)}`;
			}
			default:
				return "Scheduled";
		}
	};

	const getDistance = () => {
		// Mock distance calculation - in real app, calculate from user location
		return `${(Math.random() * 5 + 0.5).toFixed(1)}km away`;
	};

	return (
		<div className="h-full flex flex-col bg-white">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 flex justify-between items-center">
				<h2 className="text-lg font-bold text-gray-900">📋 Performances</h2>
				<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
					✕
				</button>
			</div>

			{/* Performance List */}
			<div className="flex-1 overflow-y-auto">
				{performances.length === 0 ? (
					<div className="p-8 text-center">
						<div className="text-4xl mb-4">🎭</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No performances found
						</h3>
						<p className="text-gray-600">
							Try adjusting your filters or check back later!
						</p>
					</div>
				) : (
					<div className="p-4 space-y-4">
						{performances.map((performance) => {
							const currentStop =
								performance.route.stops.find(
									(stop) => stop.status === "active",
								) || performance.route.stops[0];

							return (
								<div
									key={performance._id}
									className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
									onClick={() => onPerformanceClick(performance)}
								>
									{/* Status Badge */}
									<div className="flex justify-between items-start mb-3">
										<span
											className={`status-${performance.status === "live" ? "live" : performance.status === "scheduled" ? "scheduled" : "soon"}`}
										>
											{performance.status === "live"
												? "🔴 LIVE"
												: new Date(currentStop.startTime).getTime() -
															Date.now() <
														30 * 60 * 1000
													? "🟡 SOON"
													: "🔵 TODAY"}
										</span>
										<div className="text-right">
											<p className="text-sm font-semibold text-gray-900">
												{performance.engagement.likes} ❤️
											</p>
											<p className="text-xs text-gray-500">
												{performance.engagement.views} views
											</p>
										</div>
									</div>

									{/* Performance Info */}
									<div className="mb-3">
										<h3 className="font-semibold text-gray-900 mb-1">
											{performance.title}
										</h3>
										<p className="text-sm text-gray-600 mb-2">
											{performance.description}
										</p>

										<div className="flex items-center text-sm text-gray-500 space-x-4">
											<span>🎵 {performance.genre}</span>
											<span>📍 {currentStop.location.name}</span>
											<span>📏 {getDistance()}</span>
										</div>
									</div>

									{/* Timing */}
									<div className="mb-4">
										<p className="text-sm text-gray-700">
											{getStatusText(performance)}
										</p>
									</div>

									{/* Action Buttons */}
									<div className="flex space-x-2">
										<button
											onClick={(e) => {
												e.stopPropagation();
												// Handle like functionality here
											}}
											className="flex-1 btn-primary text-sm py-2"
										>
											❤️ Interested
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.coordinates[1]},${currentStop.location.coordinates[0]}`;
												window.open(url, "_blank");
											}}
											className="flex-1 btn-secondary text-sm py-2"
										>
											🧭 Directions
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												// Handle video play
											}}
											className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
										>
											▶️
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="p-4 border-t border-gray-200 bg-gray-50">
				<p className="text-xs text-gray-500 text-center">
					{performances.length} performance
					{performances.length !== 1 ? "s" : ""} near you
				</p>
			</div>
		</div>
	);
}
