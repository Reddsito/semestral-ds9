import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { UserModel as User } from "../models/User.js";

export async function initializeData() {
	try {
		console.log("🔧 Inicializando datos por defecto...");

		// Crear permisos básicos
		const permissions = [
			{
				name: "user:read",
				description: "Leer información de usuarios",
				resource: "user",
				action: "read",
			},
			{
				name: "user:write",
				description: "Crear y modificar usuarios",
				resource: "user",
				action: "write",
			},
			{
				name: "user:delete",
				description: "Eliminar usuarios",
				resource: "user",
				action: "delete",
			},
			{
				name: "admin:access",
				description: "Acceso al panel de administración",
				resource: "admin",
				action: "access",
			},
		];

		// Crear permisos si no existen
		for (const permission of permissions) {
			const existingPermission = await Permission.findOne({
				name: permission.name,
			});
			if (!existingPermission) {
				await Permission.create(permission);
				console.log(`✅ Permiso creado: ${permission.name}`);
			}
		}

		// Obtener todos los permisos
		const allPermissions = await Permission.find({ isActive: true });

		// Crear roles básicos
		const roles = [
			{
				name: "customer",
				description: "Usuario cliente básico",
				permissions: allPermissions
					.filter((p) => p.name === "user:read")
					.map((p) => p._id),
			},
			{
				name: "moderator",
				description: "Moderador con permisos limitados",
				permissions: allPermissions
					.filter((p) => ["user:read", "user:write"].includes(p.name))
					.map((p) => p._id),
			},
			{
				name: "admin",
				description: "Administrador con todos los permisos",
				permissions: allPermissions.map((p) => p._id),
			},
		];

		// Crear roles si no existen
		for (const role of roles) {
			const existingRole = await Role.findOne({ name: role.name });
			if (!existingRole) {
				await Role.create(role);
				console.log(`✅ Rol creado: ${role.name}`);
			}
		}

		// Crear usuario admin por defecto si no existe
		const adminEmail = "admin@example.com";
		const existingAdmin = await User.findOne({ email: adminEmail });

		if (!existingAdmin) {
			await User.create({
				email: adminEmail,
				password: "admin123",
				firstName: "Admin",
				lastName: "User",
				role: "admin",
				isActive: true,
			});
			console.log("✅ Usuario admin creado: admin@example.com / admin123");
		}

		console.log("✅ Inicialización completada");
	} catch (error) {
		console.error("❌ Error en inicialización:", error);
	}
}
