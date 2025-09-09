export function PerformanceSkeleton() {
	return (
		<div className="animate-pulse">
			<div className="bg-card border border-border rounded-lg p-4 space-y-3">
				{/* Header skeleton */}
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 bg-muted rounded-full" />
					<div className="flex-1 space-y-2">
						<div className="h-4 bg-muted rounded w-3/4" />
						<div className="h-3 bg-muted rounded w-1/2" />
					</div>
				</div>

				{/* Title skeleton */}
				<div className="h-5 bg-muted rounded w-full" />

				{/* Description skeleton */}
				<div className="space-y-2">
					<div className="h-3 bg-muted rounded w-full" />
					<div className="h-3 bg-muted rounded w-2/3" />
				</div>

				{/* Genre and status skeleton */}
				<div className="flex space-x-2">
					<div className="h-6 bg-muted rounded-full w-16" />
					<div className="h-6 bg-muted rounded-full w-20" />
				</div>

				{/* Engagement skeleton */}
				<div className="flex space-x-4">
					<div className="h-4 bg-muted rounded w-12" />
					<div className="h-4 bg-muted rounded w-12" />
					<div className="h-4 bg-muted rounded w-12" />
				</div>
			</div>
		</div>
	);
}

export function PerformanceListSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, index) => (
				<PerformanceSkeleton key={index} />
			))}
		</div>
	);
}

export function FilterSkeleton() {
	return (
		<div className="animate-pulse bg-card border border-border rounded-lg p-4 space-y-4">
			{/* Header skeleton */}
			<div className="flex items-center justify-between">
				<div className="h-6 bg-muted rounded w-32" />
				<div className="w-6 h-6 bg-muted rounded" />
			</div>

			{/* Filter sections skeleton */}
			{Array.from({ length: 4 }).map((_, index) => (
				<div key={index} className="space-y-3">
					<div className="h-4 bg-muted rounded w-20" />
					<div className="flex flex-wrap gap-2">
						{Array.from({ length: 3 }).map((_, btnIndex) => (
							<div key={btnIndex} className="h-8 bg-muted rounded-full w-16" />
						))}
					</div>
				</div>
			))}

			{/* Clear button skeleton */}
			<div className="h-10 bg-muted rounded-lg w-full" />
		</div>
	);
}
