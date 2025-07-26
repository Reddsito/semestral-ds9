import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
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
		status: {
			type: String,
			enum: ["active", "expired", "deleted"],
			default: "active",
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		notes: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
quoteSchema.index({ userId: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ expiresAt: 1 });
quoteSchema.index({ createdAt: -1 });

// Método para verificar si la cotización está expirada
quoteSchema.methods.isExpired = function () {
	return new Date() > this.expiresAt;
};

// Método para marcar como expirada
quoteSchema.methods.markAsExpired = function () {
	this.status = "expired";
	return this.save();
};

// Middleware para establecer fecha de expiración (30 días)
quoteSchema.pre("save", function (next) {
	if (this.isNew && !this.expiresAt) {
		this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
	}
	next();
});

export const Quote = mongoose.model("Quote", quoteSchema);
