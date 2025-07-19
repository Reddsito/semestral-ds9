import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
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
		permissions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Permission",
			},
		],
		inheritsFrom: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Role",
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		level: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	},
);

// Índices
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

// Método para verificar si tiene un permiso específico
roleSchema.methods.hasPermission = function (permissionName) {
	return this.permissions.some(
		(permission) => permission.name === permissionName,
	);
};

// Método para obtener todos los permisos (incluyendo herencia)
roleSchema.methods.getAllPermissions = async function () {
	const permissions = new Set();

	// Agregar permisos directos
	this.permissions.forEach((permission) => {
		permissions.add(permission.name);
	});

	// Agregar permisos heredados
	for (const inheritedRole of this.inheritsFrom) {
		const inheritedPermissions = await inheritedRole.getAllPermissions();
		inheritedPermissions.forEach((permission) => {
			permissions.add(permission);
		});
	}

	return Array.from(permissions);
};

export const Role = mongoose.model("Role", roleSchema);
