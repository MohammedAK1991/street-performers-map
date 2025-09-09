// User Types
export interface User {
	_id: string;
	email: string;
	username: string;
	role: "performer" | "audience";
	profile: UserProfile;
	location: UserLocation;
	preferences: UserPreferences;
	statistics: UserStatistics;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserProfile {
	displayName: string;
	bio?: string;
	avatar?: string;
	genres?: string[];
	socialLinks?: {
		instagram?: string;
		spotify?: string;
		youtube?: string;
	};
}

export interface UserLocation {
	city: string;
	country: string;
	coordinates: [number, number]; // [lng, lat]
}

export interface UserPreferences {
	notifications: boolean;
	genres: string[];
	radius: number; // km
}

export interface UserStatistics {
	totalLikes: number;
	totalTips: number;
	performanceCount: number;
}

// Performance Types
export interface Performance {
	_id: string;
	performerId: string;
	title: string;
	description?: string;
	genre: string;
	route: PerformanceRoute;
	videoUrl?: string; // Video URL from client upload
	videoThumbnail?: string; // Video thumbnail URL
	engagement: PerformanceEngagement;
	status: "scheduled" | "live" | "completed" | "cancelled";
	scheduledFor: Date;
	createdAt: Date;
	expiresAt: Date; // Auto-delete after 24 hours
}

export interface PerformanceRoute {
	stops: PerformanceStop[];
}

export interface PerformanceStop {
	location: {
		coordinates: [number, number];
		address: string;
		name?: string;
	};
	startTime: Date;
	endTime: Date;
	status: "scheduled" | "active" | "completed" | "cancelled";
	scheduledTime?: string;
}

export interface PerformanceEngagement {
	likes: number;
	views: number;
	tips: number;
	likedBy: string[];
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code?: string;
	};
	meta?: {
		pagination?: PaginationMeta;
		timestamp: string;
	};
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

// Authentication Types
export interface AuthResponse {
	user: User;
	token: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	password: string;
	username: string;
	role: "performer" | "audience";
	displayName: string;
}

// Internal types for database operations
export interface UserWithPassword extends Omit<User, "_id"> {
	password: string;
}

// Search and Filter Types
export interface SearchFilters {
	genre?: string;
	timeRange?: "now" | "hour" | "today" | "custom";
	distance?: number;
	popularity?: "trending" | "popular" | "new";
	location?: {
		coordinates: [number, number];
		radius: number;
	};
}

export interface SearchResults {
	performances: Performance[];
	total: number;
	filters: SearchFilters;
}

// Map Types
export interface MapMarker {
	id: string;
	position: {
		lat: number;
		lng: number;
	};
	type: "performance";
	status: "live" | "soon" | "scheduled";
	popularity: number;
	performance: Performance;
}

// WebSocket Event Types
export interface WebSocketEvent {
	type: string;
	data: any;
	timestamp: string;
}

export interface PerformanceUpdateEvent extends WebSocketEvent {
	type: "performance-update";
	data: {
		performanceId: string;
		status: Performance["status"];
		location?: [number, number];
		engagement: PerformanceEngagement;
	};
}

// Error Types
export class ApiError extends Error {
	constructor(
		public statusCode: number,
		public message: string,
		public code?: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

// Utility Types
export type Coordinates = [number, number]; // [lng, lat]

export interface TimeRange {
	start: Date;
	end: Date;
}

export interface Location {
	coordinates: Coordinates;
	address: string;
	name?: string;
}

// Form Types
export interface CreatePerformanceDto {
	title: string;
	description?: string;
	genre: string;
	route: {
		stops: {
			location: Location;
			startTime: string; // ISO string
			endTime: string; // ISO string
		}[];
	};
	scheduledFor: string; // ISO string
	videoUrl?: string; // Optional video URL from client upload
	videoThumbnail?: string; // Optional video thumbnail URL
}

export interface UpdatePerformanceDto extends Partial<CreatePerformanceDto> {
	status?: Performance["status"];
}

// Alias for CreatePerformanceDto
export type CreatePerformanceData = CreatePerformanceDto;

// Filter types
export interface PerformanceFilters {
	genre?: string;
	search?: string;
	status?: Performance["status"];
	timeRange?: "now" | "hour" | "today" | "all";
	location?: {
		lat: number;
		lng: number;
		radius?: number;
	};
}

// Constants
export const GENRES = [
	"rock",
	"jazz",
	"folk",
	"pop",
	"classical",
	"blues",
	"country",
	"electronic",
	"hip-hop",
	"reggae",
	"other",
] as const;

export type Genre = (typeof GENRES)[number];

export const PERFORMANCE_STATUS = [
	"scheduled",
	"live",
	"completed",
	"cancelled",
] as const;

export type PerformanceStatus = (typeof PERFORMANCE_STATUS)[number];

export const USER_ROLES = ["performer", "audience"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Video Types
export interface Video {
	_id: string;
	userId: string;
	performanceId?: string;
	cloudinaryPublicId: string;
	cloudinaryUrl: string;
	secureUrl: string;
	thumbnailUrl: string;
	filename: string;
	format: string;
	duration?: number;
	size: number;
	width?: number;
	height?: number;
	uploadedAt: Date;
	status: VideoStatus;
	uploadDate: string; // YYYY-MM-DD
	moderationStatus: VideoModerationStatus;
	moderationReason?: string;
	views: number;
	totalWatchTime: number;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export const VIDEO_STATUS = ["processing", "ready", "failed"] as const;
export type VideoStatus = (typeof VIDEO_STATUS)[number];

export const VIDEO_MODERATION_STATUS = [
	"pending",
	"approved",
	"rejected",
] as const;
export type VideoModerationStatus = (typeof VIDEO_MODERATION_STATUS)[number];

// Video Upload Types
export interface UploadVideoRequest {
	performanceId?: string;
	file: File;
}

export interface UploadVideoResponse {
	video: Video;
	message: string;
}

export interface VideoAnalytics {
	totalVideos: number;
	totalViews: number;
	totalWatchTime: number;
	averageViews: number;
	averageWatchTime: number;
}

export interface VideoUploadEligibility {
	canUpload: boolean;
	todayCount: number;
	dailyLimit: number;
	remainingUploads: number;
}
