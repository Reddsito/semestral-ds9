import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
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
		resource: {
			type: String,
			required: true,
		},
		action: {
			type: String,
			required: true,
			enum: ["create", "read", "update", "delete", "manage"],
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
permissionSchema.index({ name: 1 });
permissionSchema.index({ resource: 1, action: 1 });

// Método para obtener el permiso completo (resource:action)
permissionSchema.methods.getFullPermission = function () {
	return `${this.resource}:${this.action}`;
};

export const Permission = mongoose.model("Permission", permissionSchema);
