import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		street: {
			type: String,
			required: true,
			trim: true,
		},
		city: {
			type: String,
			required: true,
			trim: true,
		},
		state: {
			type: String,
			required: true,
			trim: true,
		},
		zipCode: {
			type: String,
			required: true,
			trim: true,
		},
		country: {
			type: String,
			required: true,
			default: "Ecuador",
		},
		phone: {
			type: String,
			trim: true,
		},
		isDefault: {
			type: Boolean,
			default: false,
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
addressSchema.index({ userId: 1 });
addressSchema.index({ isDefault: 1 });
addressSchema.index({ isActive: 1 });

export const Address = mongoose.model("Address", addressSchema);
