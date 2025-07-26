import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
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
		pricePerGram: {
			type: Number,
			required: true,
			min: 0,
		},
		color: {
			type: String,
			default: "Natural",
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
materialSchema.index({ name: 1 });
materialSchema.index({ isActive: 1 });

export const Material = mongoose.model("Material", materialSchema);
