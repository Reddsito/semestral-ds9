import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
const AutoIncrement = AutoIncrementFactory(mongoose);

const orderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: Number,
			unique: true,
			required: true,
		},
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
				"RECEIVED",
				"TECHNICAL_REVIEW",
				"IN_PRODUCTION",
				"QUALITY_CONTROL",
				"SHIPPED",
				"DELIVERED",
				"CANCELED",
			],
			default: "RECEIVED",
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		priceBreakdown: {
			materialCost: {
				pricePerGram: Number,
				weight: Number,
				costPerUnit: Number,
				quantity: Number,
				total: Number,
			},
			finishCost: {
				basePrice: Number,
				multiplier: Number,
				costPerUnit: Number,
				quantity: Number,
				total: Number,
			},
			fixedCosts: {
				shippingCost: Number,
				orderFixedCost: Number,
				total: Number,
				note: String,
			},
			subtotal: Number,
			tax: Number,
			total: Number,
			calculationNotes: String,
		},
		deliveryDate: {
			type: Date,
		},
		estimatedDelivery: {
			type: Date,
		},
		stripeTransferId: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

orderSchema.plugin(AutoIncrement, { inc_field: "orderNumber" });

// Índices
orderSchema.index({ userId: 1 });
orderSchema.index({ quoteId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
