import type { User as IUser } from "@spm/shared-types";
import mongoose, { Schema, type Document } from "mongoose";

// Mongoose document interface
export interface UserDocument extends Omit<IUser, "_id">, Document {
	_id: mongoose.Types.ObjectId;
	clerkId?: string;
	password: string;
	comparePassword(password: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<UserDocument>(
	{
		clerkId: {
			type: String,
			unique: true,
			sparse: true, // Allows null values but ensures uniqueness when present
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		role: {
			type: String,
			enum: ["performer", "audience"],
			required: true,
		},
		profile: {
			displayName: {
				type: String,
				required: true,
				trim: true,
				maxlength: 100,
			},
			bio: {
				type: String,
				maxlength: 500,
			},
			avatar: {
				type: String,
			},
			genres: [
				{
					type: String,
					enum: [
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
					],
				},
			],
			socialLinks: {
				instagram: String,
				spotify: String,
				youtube: String,
			},
		},
		location: {
			city: {
				type: String,
				required: true,
			},
			country: {
				type: String,
				required: true,
			},
			coordinates: {
				type: [Number, Number],
				required: true,
			},
		},
		preferences: {
			notifications: {
				type: Boolean,
				default: true,
			},
			genres: [
				{
					type: String,
					enum: [
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
					],
				},
			],
			radius: {
				type: Number,
				default: 5,
				min: 1,
				max: 50,
			},
		},
		statistics: {
			totalLikes: {
				type: Number,
				default: 0,
			},
			totalTips: {
				type: Number,
				default: 0,
			},
			performanceCount: {
				type: Number,
				default: 0,
			},
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: (doc, ret: any) => {
				ret._id = ret._id.toString();
				ret.password = undefined;
				ret.__v = undefined;
				return ret;
			},
		},
	},
);

// Indexes for performance (email and username already indexed via unique: true)
userSchema.index({ role: 1 });
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ "location.city": 1 });

// Virtual for password comparison (will be implemented in service)
userSchema.methods.comparePassword = async function (
	password: string,
): Promise<boolean> {
	const bcrypt = await import("bcryptjs");
	return bcrypt.default.compare(password, this.password);
};

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	const bcrypt = await import("bcryptjs");
	const salt = await bcrypt.default.genSalt(12);
	this.password = await bcrypt.default.hash(this.password, salt);
	next();
});

// Transform toJSON to remove password
userSchema.set("toJSON", {
	transform: (doc, ret: any) => {
		ret.password = undefined;
		ret._id = ret._id.toString();
		return ret;
	},
});

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
