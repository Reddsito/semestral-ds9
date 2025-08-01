import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		level: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

export const Role = mongoose.model("Role", roleSchema);
