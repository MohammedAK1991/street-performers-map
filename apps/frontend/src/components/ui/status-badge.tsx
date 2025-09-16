import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { Performance } from "@spm/shared-types";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
	"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			status: {
				live: "border-transparent bg-green-100 text-green-800 shadow-sm hover:bg-green-200",
				scheduled: "border-transparent bg-blue-100 text-blue-800 shadow-sm hover:bg-blue-200",
				completed: "border-transparent bg-gray-100 text-gray-800 shadow-sm hover:bg-gray-200",
				cancelled: "border-transparent bg-red-100 text-red-800 shadow-sm hover:bg-red-200",
			},
			size: {
				sm: "px-2 py-0.5 text-xs",
				default: "px-2.5 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			status: "scheduled",
			size: "default",
		},
	}
);

const statusConfig = {
	live: {
		icon: "🔴",
		label: "LIVE NOW",
	},
	scheduled: {
		icon: "🔵",
		label: "SCHEDULED",
	},
	completed: {
		icon: "⚫",
		label: "COMPLETED",
	},
	cancelled: {
		icon: "🚫",
		label: "CANCELLED",
	},
} as const;

export interface StatusBadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof statusBadgeVariants> {
	status: Performance["status"];
	showIcon?: boolean;
	showLabel?: boolean;
	customLabel?: string;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
	({
		className,
		status,
		size,
		showIcon = true,
		showLabel = true,
		customLabel,
		...props
	}, ref) => {
		const config = statusConfig[status];

		return (
			<div
				className={cn(statusBadgeVariants({ status, size }), className)}
				ref={ref}
				{...props}
			>
				{showIcon && (
					<span className="shrink-0" role="img" aria-label={`${status} status`}>
						{config.icon}
					</span>
				)}
				{showLabel && (
					<span>{customLabel || config.label}</span>
				)}
			</div>
		);
	}
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants, statusConfig };