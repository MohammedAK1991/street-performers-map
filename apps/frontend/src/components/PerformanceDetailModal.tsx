import type { Performance } from "@spm/shared-types";
import { useState } from "react";

interface PerformanceDetailModalProps {
	performance: Performance;
	isOpen: boolean;
	onClose: () => void;
}

export function PerformanceDetailModal({
	performance,
	isOpen,
	onClose,
}: PerformanceDetailModalProps) {
	const [activeTab, setActiveTab] = useState<"details" | "route">("details");

	if (!isOpen) return null;

	const formatTime = (date: Date | string) => {
		return new Date(date).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-200">
					<h2 className="text-2xl font-bold text-gray-900">
						{performance.title}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl"
					>
						×
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200">
					<button
						onClick={() => setActiveTab("details")}
						className={`px-6 py-3 font-medium ${
							activeTab === "details"
								? "text-purple-600 border-b-2 border-purple-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Details
					</button>
					<button
						onClick={() => setActiveTab("route")}
						className={`px-6 py-3 font-medium ${
							activeTab === "route"
								? "text-purple-600 border-b-2 border-purple-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Route ({performance.route.stops.length} stops)
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{activeTab === "details" && (
						<div className="space-y-6">
							{/* Status and Stats */}
							<div className="flex items-center justify-between">
								<span
									className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${performance.status === "live" ? "bg-green-100 text-green-800" : ""}
                  ${performance.status === "scheduled" ? "bg-blue-100 text-blue-800" : ""}
                  ${performance.status === "completed" ? "bg-gray-100 text-gray-800" : ""}
                  ${performance.status === "cancelled" ? "bg-red-100 text-red-800" : ""}
                `}
								>
									{performance.status === "live" && "🔴 LIVE NOW"}
									{performance.status === "scheduled" && "🔵 SCHEDULED"}
									{performance.status === "completed" && "⚫ COMPLETED"}
									{performance.status === "cancelled" && "🚫 CANCELLED"}
								</span>
								<div className="text-right">
									<p className="text-2xl font-bold text-gray-900">
										{performance.engagement.likes} ❤️
									</p>
									<p className="text-sm text-gray-500">
										{performance.engagement.views} views
									</p>
								</div>
							</div>

							{/* Description */}
							{performance.description && (
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">
										Description
									</h3>
									<p className="text-gray-600">{performance.description}</p>
								</div>
							)}

							{/* Genre and Duration */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">Genre</h3>
									<p className="text-gray-600 capitalize">
										{performance.genre}
									</p>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
									<p className="text-gray-600">
										{performance.route.stops.length} stop
										{performance.route.stops.length !== 1 ? "s" : ""}
									</p>
								</div>
							</div>

							{/* Next Stop */}
							{performance.status === "scheduled" &&
								performance.route.stops.length > 0 && (
									<div>
										<h3 className="font-semibold text-gray-900 mb-2">
											Next Stop
										</h3>
										<div className="bg-gray-50 p-4 rounded-lg">
											<p className="font-medium text-gray-900">
												{performance.route.stops[0].location.address}
											</p>
											<p className="text-sm text-gray-600">
												{formatDate(performance.route.stops[0].startTime)} at{" "}
												{formatTime(performance.route.stops[0].startTime)}
											</p>
										</div>
									</div>
								)}
						</div>
					)}

					{activeTab === "route" && (
						<div className="space-y-4">
							<h3 className="font-semibold text-gray-900 mb-4">
								Performance Route
							</h3>
							{performance.route.stops.map((stop, index) => (
								<div
									key={index}
									className="border border-gray-200 rounded-lg p-4"
								>
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
											{index + 1}
										</div>
										<div className="flex-1">
											<h4 className="font-medium text-gray-900">
												{stop.location.address}
											</h4>
											{stop.location.name && (
												<p className="text-sm text-gray-600">
													{stop.location.name}
												</p>
											)}
											<div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
												<span>
													🕐 {formatTime(stop.startTime)} -{" "}
													{formatTime(stop.endTime)}
												</span>
												<span
													className={`
                          px-2 py-1 rounded-full text-xs
                          ${stop.status === "active" ? "bg-green-100 text-green-800" : ""}
                          ${stop.status === "scheduled" ? "bg-blue-100 text-blue-800" : ""}
                          ${stop.status === "completed" ? "bg-gray-100 text-gray-800" : ""}
                          ${stop.status === "cancelled" ? "bg-red-100 text-red-800" : ""}
                        `}
												>
													{stop.status}
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
					>
						Close
					</button>
					<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
						❤️ Like
					</button>
				</div>
			</div>
		</div>
	);
}
