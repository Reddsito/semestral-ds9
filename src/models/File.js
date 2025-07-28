import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		filename: {
			type: String,
			required: true,
		},
		filePath: {
			type: String,
			required: true,
		},
		fileSize: {
			type: Number,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		volume: {
			type: Number,
			default: 0, // cm³
		},
		dimensions: {
			width: Number, // mm
			height: Number, // mm
			depth: Number, // mm
		},
		isValid: {
			type: Boolean,
			default: false,
		},
		validationErrors: [String],
		orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
		type: {
			type: String,
			enum: ["quotation", "order", "image", "avatar"],
			default: "quotation",
		},
		status: {
			type: String,
			enum: ["quotation", "ordered", "completed", "cancelled"],
			default: "quotation",
		},
		quotedAt: { type: Date, default: Date.now },
		orderedAt: { type: Date },
	},
	{
		timestamps: true,
	},
);

// Índices
fileSchema.index({ userId: 1 });
fileSchema.index({ filename: 1 });
fileSchema.index({ isValid: 1 });
fileSchema.index({ type: 1 });

export const File = mongoose.model("File", fileSchema);
