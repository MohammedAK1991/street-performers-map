import type { Performance } from "@spm/shared-types";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{performance.title}
					</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "route")}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="route">Route ({performance.route.stops.length} stops)</TabsTrigger>
					</TabsList>

					<TabsContent value="details" className="space-y-6">
						{/* Status and Stats */}
						<div className="flex items-center justify-between">
							<Badge
								variant={
									performance.status === "live"
										? "destructive"
										: performance.status === "scheduled"
											? "default"
											: performance.status === "completed"
												? "secondary"
												: "destructive"
								}
							>
								{performance.status === "live" && "🔴 LIVE NOW"}
								{performance.status === "scheduled" && "🔵 SCHEDULED"}
								{performance.status === "completed" && "⚫ COMPLETED"}
								{performance.status === "cancelled" && "🚫 CANCELLED"}
							</Badge>
							<div className="text-right">
								<p className="text-2xl font-bold text-foreground">
									{performance.engagement.likes} ❤️
								</p>
								<p className="text-sm text-muted-foreground">
									{performance.engagement.views} views
								</p>
							</div>
						</div>

						{/* Description */}
						{performance.description && (
							<div>
								<h3 className="font-semibold text-foreground mb-2">
									Description
								</h3>
								<p className="text-muted-foreground">{performance.description}</p>
							</div>
						)}

						{/* Genre and Duration */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<h3 className="font-semibold text-foreground mb-2">Genre</h3>
								<p className="text-muted-foreground capitalize">
									{performance.genre}
								</p>
							</div>
							<div>
								<h3 className="font-semibold text-foreground mb-2">Duration</h3>
								<p className="text-muted-foreground">
									{performance.route.stops.length} stop
									{performance.route.stops.length !== 1 ? "s" : ""}
								</p>
							</div>
						</div>

						{/* Next Stop */}
						{performance.status === "scheduled" &&
							performance.route.stops.length > 0 && (
								<div>
									<h3 className="font-semibold text-foreground mb-2">
										Next Stop
									</h3>
									<div className="bg-muted p-4 rounded-lg">
										<p className="font-medium text-foreground">
											{performance.route.stops[0].location.address}
										</p>
										<p className="text-sm text-muted-foreground">
											{formatDate(performance.route.stops[0].startTime)} at{" "}
											{formatTime(performance.route.stops[0].startTime)}
										</p>
									</div>
								</div>
							)}
					</TabsContent>

					<TabsContent value="route" className="space-y-4">
						<h3 className="font-semibold text-foreground mb-4">
							Performance Route
						</h3>
						{performance.route.stops.map((stop, index) => (
							<div
								key={index}
								className="border border-border rounded-lg p-4"
							>
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
										{index + 1}
									</div>
									<div className="flex-1">
										<h4 className="font-medium text-foreground">
											{stop.location.address}
										</h4>
										{stop.location.name && (
											<p className="text-sm text-muted-foreground">
												{stop.location.name}
											</p>
										)}
										<div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
											<span>
												🕐 {formatTime(stop.startTime)} -{" "}
												{formatTime(stop.endTime)}
											</span>
											<Badge
												variant={
													stop.status === "active"
														? "destructive"
														: stop.status === "scheduled"
															? "default"
															: stop.status === "completed"
																? "secondary"
																: "destructive"
												}
												className="text-xs"
											>
												{stop.status}
											</Badge>
										</div>
									</div>
								</div>
							</div>
						))}
					</TabsContent>
				</Tabs>

				{/* Footer */}
				<div className="flex justify-end space-x-3 pt-6 border-t border-border">
					<Button
						variant="outline"
						onClick={onClose}
					>
						Close
					</Button>
					<Button>
						❤️ Like
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
