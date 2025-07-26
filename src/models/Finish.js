import mongoose from "mongoose";

const finishSchema = new mongoose.Schema(
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
		priceMultiplier: {
			type: Number,
			required: true,
			min: 1,
			default: 1,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
finishSchema.index({ name: 1 });
finishSchema.index({ isActive: 1 });

export const Finish = mongoose.model("Finish", finishSchema);
