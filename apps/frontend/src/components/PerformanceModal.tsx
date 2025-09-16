import { useLikePerformance, usePerformance } from "@/hooks/usePerformances";
import { usePerformancePaymentSummary } from "@/hooks/usePerformancePaymentSummary";
import { useUser } from "@clerk/clerk-react";
import type { Performance } from "@spm/shared-types";
import type React from "react";
import { useEffect, useState } from "react";
import { TipModal } from "./TipModal";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PerformanceModalProps {
	performance: Performance;
	isOpen: boolean;
	onClose: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({
	performance: initialPerformance,
	isOpen,
	onClose,
}) => {
	const { user } = useUser();
	const likePerformanceMutation = useLikePerformance();
	const [isTipModalOpen, setIsTipModalOpen] = useState(false);

	// Get the latest performance data from cache to ensure we have the most up-to-date engagement
	const { data: performance = initialPerformance } = usePerformance(
		initialPerformance._id,
	);

	// Get real-time tip data from the payment API
	const { data: paymentData, isLoading: paymentLoading } = usePerformancePaymentSummary(
		performance._id
	);

	// Check if current user has liked this performance
	const isLiked = user && performance.engagement?.likedBy?.includes(user.id);

	// ESC key handler
	useEffect(() => {
		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscKey);
			return () => {
				document.removeEventListener("keydown", handleEscKey);
			};
		}
	}, [isOpen, onClose]);

	const handleLikePerformance = async (performanceId: string) => {
		try {
			await likePerformanceMutation.mutateAsync({
				performanceId,
				userId: user?.id,
			});
		} catch (error) {
			console.error("Failed to like performance:", error);
		}
	};

	const getStatusText = (perf: Performance) => {
		switch (perf.status) {
			case "live":
				return "LIVE NOW";
			case "scheduled":
				return "UPCOMING";
			case "completed":
				return "FINISHED";
			default:
				return "UNKNOWN";
		}
	};

	if (!isOpen) return null;

	// Safety check to ensure performance data is loaded
	if (!performance || !performance.engagement) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-md">
					<div className="text-center py-6">
						<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-muted-foreground">Loading performance data...</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl">
						{performance.title}
					</DialogTitle>
					<DialogDescription asChild>
						<Badge
							variant={
								performance.status === "live"
									? "destructive"
									: performance.status === "scheduled"
										? "default"
										: "secondary"
							}
							className="w-fit"
						>
							{getStatusText(performance)}
						</Badge>
					</DialogDescription>
				</DialogHeader>

				{/* Content */}
				<div className="p-4">
					{/* Video Player */}
					{performance.videoUrl && (
						<div className="mb-4">
							<h3 className="text-base font-semibold text-foreground mb-2">
								Performance Video
							</h3>
							<div
								className="relative bg-black rounded-lg overflow-hidden"
								style={{ height: "250px" }}
							>
								<video
									controls
									autoPlay
									muted
									playsInline
									poster={performance.videoThumbnail}
									className="w-full h-full object-cover"
									style={{ height: "250px" }}
									onError={(e) => {
										console.error("Video error:", e);
										console.error("Video URL:", performance.videoUrl);
									}}
									onLoadStart={() => {
										console.log("Video loading started:", performance.videoUrl);
									}}
									onCanPlay={() => {
										console.log("Video can play:", performance.videoUrl);
									}}
								>
									<source src={performance.videoUrl} type="video/mp4" />
									<source src={performance.videoUrl} type="video/webm" />
									<source src={performance.videoUrl} type="video/ogg" />
									Your browser does not support the video tag.
								</video>
							</div>
						</div>
					)}

					{/* Description */}
					{performance.description && (
						<div className="mb-4">
							<h3 className="text-base font-semibold text-foreground mb-2">
								About
							</h3>
							<p className="text-muted-foreground leading-relaxed text-sm">
								{performance.description}
							</p>
						</div>
					)}

					{/* Performance Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<h3 className="text-base font-semibold text-foreground mb-2">
								Details
							</h3>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">🎵</span>
									<span className="capitalize font-medium text-foreground text-sm">
										{performance.genre}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">📍</span>
									<span className="text-muted-foreground text-sm">
										{performance.route.stops[0].location.name}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">📅</span>
									<span className="text-muted-foreground text-sm">
										{new Date(performance.scheduledFor).toLocaleDateString()} at{" "}
										{new Date(performance.scheduledFor).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
							</div>
						</div>

						<div>
							<h3 className="text-base font-semibold text-foreground mb-2">
								Engagement
							</h3>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">❤️</span>
									<span className="text-muted-foreground text-sm">
										{performance.engagement?.likes || 0} likes
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">👀</span>
									<span className="text-muted-foreground text-sm">
										{performance.engagement?.views || 0} views
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<span className="text-muted-foreground">💰</span>
									<span className="text-muted-foreground text-sm">
										{paymentLoading ? (
											"Loading..."
										) : (
											`${paymentData?.summary.tipCount || 0} tips`
										)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex space-x-3">
						<Button
							onClick={() => handleLikePerformance(performance._id)}
							disabled={likePerformanceMutation.isPending}
							variant={isLiked ? "destructive" : "default"}
							className="flex-1"
						>
							{likePerformanceMutation.isPending ? (
								<>
									<span>⏳</span>
									<span className="ml-2">Loading...</span>
								</>
							) : (
								<>
									<span>{isLiked ? "💔" : "❤️"}</span>
									<span className="ml-2">
										{isLiked ? "Unlike" : "Like"} (
										{performance.engagement?.likes || 0})
									</span>
								</>
							)}
						</Button>

						{/* Tip Button */}
						<Button
							onClick={() => setIsTipModalOpen(true)}
							className="flex-1 bg-green-600 hover:bg-green-700"
						>
							<span>💰</span>
							<span className="ml-2">Tip Performer</span>
						</Button>

						<Button
							onClick={() => {
								const currentStop =
									performance.route.stops.find(
										(stop) => stop.status === "active",
									) || performance.route.stops[0];
								const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.coordinates[1]},${currentStop.location.coordinates[0]}`;
								window.open(url, "_blank");
							}}
							variant="outline"
							className="flex-1"
						>
							<span>🧭</span>
							<span className="ml-2">Get Directions</span>
						</Button>
					</div>
				</div>

				{/* Tip Modal */}
				<TipModal
					isOpen={isTipModalOpen}
					onClose={() => setIsTipModalOpen(false)}
					performanceId={performance._id}
					performerId={performance.performerId}
					performerName={performance.title}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default PerformanceModal;
