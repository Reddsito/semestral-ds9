import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			validate: {
				validator: function (v) {
					return /^[\+]?[\d\s\-\(\)]{8,}$/.test(v);
				},
				message: "Número de teléfono inválido",
			},
		},
		notes: {
			type: String,
			trim: true,
			maxlength: 500,
			default: "",
		},
		coordinates: {
			lat: {
				type: Number,
				required: true,
				min: -90,
				max: 90,
			},
			lng: {
				type: Number,
				required: true,
				min: -180,
				max: 180,
			},
		},
		// Validación de que esté dentro de Panamá
		isValidLocation: {
			type: Boolean,
			default: true,
			validate: {
				validator: function () {
					const { lat, lng } = this.coordinates;
					// Límites de Panamá
					return lat >= 7.0 && lat <= 9.8 && lng >= -83.0 && lng <= -77.0;
				},
				message: "La ubicación debe estar dentro del territorio de Panamá",
			},
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
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Índices para búsquedas eficientes
addressSchema.index({ userId: 1, isActive: 1 });
addressSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });
addressSchema.index({ isDefault: 1 });

// Virtual para obtener la dirección formateada
addressSchema.virtual("displayName").get(function () {
	return `${this.name} - ${this.phone}`;
});

// Método para validar ubicación en Panamá
addressSchema.methods.validatePanamaLocation = function () {
	const { lat, lng } = this.coordinates;
	return lat >= 7.0 && lat <= 9.8 && lng >= -83.0 && lng <= -77.0;
};

// Hook pre-save para validar ubicación
addressSchema.pre("save", function (next) {
	if (this.coordinates && !this.validatePanamaLocation()) {
		const error = new Error(
			"La dirección debe estar ubicada dentro del territorio de Panamá",
		);
		error.statusCode = 400;
		return next(error);
	}
	next();
});

// Método estático para obtener direcciones por usuario
addressSchema.statics.findByUser = function (userId) {
	return this.find({ userId: userId, isActive: true }).sort({ createdAt: -1 });
};

export const Address = mongoose.model("Address", addressSchema);
