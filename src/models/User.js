import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: function () {
				return !this.googleId; // Password solo requerido si no hay Google ID
			},
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true,
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		role: {
			type: String,
			enum: ["admin", "customer", "moderator"],
			default: "customer",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastLogin: {
			type: Date,
		},
		avatar: {
			type: String,
		},
		avatarKey: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

// Índices para mejorar rendimiento
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Método para verificar password
userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

// Método para verificar si tiene un rol específico
userSchema.methods.hasRole = function (roleName) {
	return this.role === roleName;
};

// Método para verificar si tiene permisos específicos (simplificado)
userSchema.methods.hasPermission = function (permissionName) {
	// Por ahora, solo admin tiene todos los permisos
	return this.role === "admin";
};

// Middleware para hashear password antes de guardar
userSchema.pre("save", async function (next) {
	if (this.isModified("password")) {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	}
	next();
});

// Método para obtener nombre completo
userSchema.virtual("fullName").get(function () {
	return `${this.firstName} ${this.lastName}`;
});

// Configurar virtuals en JSON
userSchema.set("toJSON", {
	virtuals: true,
	transform: function (doc, ret) {
		delete ret.password;
		return ret;
	},
});

export const UserModel = mongoose.model("User", userSchema);
