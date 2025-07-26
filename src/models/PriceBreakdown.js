import mongoose from "mongoose";

const priceBreakdownSchema = new mongoose.Schema(
	{
		orderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			required: true,
		},
		materialCost: {
			pricePerGram: { type: Number, required: true },
			weight: { type: Number, required: true }, // gramos
			total: { type: Number, required: true },
		},
		finishCost: {
			basePrice: { type: Number, required: true },
			multiplier: { type: Number, required: true },
			total: { type: Number, required: true },
		},
		shippingCost: {
			type: Number,
			default: 0,
		},
		subtotal: {
			type: Number,
			required: true,
		},
		tax: {
			type: Number,
			default: 0,
		},
		total: {
			type: Number,
			required: true,
		},
		calculationNotes: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
priceBreakdownSchema.index({ orderId: 1 });

export const PriceBreakdown = mongoose.model(
	"PriceBreakdown",
	priceBreakdownSchema,
);
