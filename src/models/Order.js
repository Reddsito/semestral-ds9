import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		fileId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "File",
			required: true,
		},
		materialId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Material",
			required: true,
		},
		finishId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Finish",
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
			default: 1,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"review",
				"approved",
				"rejected",
				"production",
				"shipped",
				"delivered",
				"cancelled",
			],
			default: "pending",
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		priceBreakdownId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "PriceBreakdown",
		},
		deliveryAddress: {
			street: String,
			city: String,
			state: String,
			zipCode: String,
			country: String,
		},
		deliveryDate: {
			type: Date,
		},
		estimatedDelivery: {
			type: Date,
		},
		notes: {
			type: String,
		},
		adminNotes: {
			type: String,
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed"],
			default: "pending",
		},
		paymentId: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
