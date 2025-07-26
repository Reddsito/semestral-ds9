import { Role } from "../models/Role.js";
import { UserModel as User } from "../models/User.js";
import { Material } from "../models/Material.js";
import { Finish } from "../models/Finish.js";

export async function initializeData() {
	try {
		console.log("🔧 Inicializando datos por defecto...");

		// Crear roles básicos
		const roles = [
			{
				name: "customer",
				description: "Usuario cliente básico",
				level: 1,
			},
			{
				name: "moderator",
				description: "Moderador con permisos limitados",
				level: 2,
			},
			{
				name: "admin",
				description: "Administrador con todos los permisos",
				level: 3,
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

		// Crear materiales básicos
		const materials = [
			{
				name: "PLA",
				description:
					"Ácido poliláctico - Material biodegradable y fácil de imprimir",
				pricePerGram: 0.02,
				color: "Natural",
			},
			{
				name: "ABS",
				description:
					"Acrilonitrilo butadieno estireno - Material resistente y duradero",
				pricePerGram: 0.025,
				color: "Natural",
			},
			{
				name: "PETG",
				description:
					"Polietileno tereftalato glicol - Material fuerte y resistente a impactos",
				pricePerGram: 0.03,
				color: "Natural",
			},
			{
				name: "TPU",
				description:
					"Poliuretano termoplástico - Material flexible y resistente",
				pricePerGram: 0.04,
				color: "Natural",
			},
		];

		// Crear materiales si no existen
		for (const material of materials) {
			const existingMaterial = await Material.findOne({ name: material.name });
			if (!existingMaterial) {
				await Material.create(material);
				console.log(`✅ Material creado: ${material.name}`);
			}
		}

		// Crear acabados básicos
		const finishes = [
			{
				name: "Sin acabado",
				description: "Impresión directa sin acabado adicional",
				priceMultiplier: 1.0,
			},
			{
				name: "Lijado básico",
				description: "Lijado manual para mejorar la superficie",
				priceMultiplier: 1.2,
			},
			{
				name: "Lijado profesional",
				description: "Lijado profesional con múltiples pasadas",
				priceMultiplier: 1.5,
			},
			{
				name: "Pintura básica",
				description: "Pintura con color sólido",
				priceMultiplier: 1.8,
			},
			{
				name: "Pintura profesional",
				description: "Pintura con efectos y detalles",
				priceMultiplier: 2.2,
			},
		];

		// Crear acabados si no existen
		for (const finish of finishes) {
			const existingFinish = await Finish.findOne({ name: finish.name });
			if (!existingFinish) {
				await Finish.create(finish);
				console.log(`✅ Acabado creado: ${finish.name}`);
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
