import { AdminController } from "../controllers/adminController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

export async function adminRoutes(fastify) {
	const adminController = new AdminController();

	// Middleware combinado: autenticación + verificación de admin
	const requireAuthAndAdmin = [authenticateToken, requireAdmin];

	// Rutas de administración (solo admin)
	fastify.get(
		"/stats",
		{ preHandler: requireAuthAndAdmin },
		adminController.getFileStats.bind(adminController),
	);

	fastify.get(
		"/chart-data",
		{ preHandler: requireAuthAndAdmin },
		adminController.getChartData.bind(adminController),
	);

	fastify.post(
		"/cleanup",
		{ preHandler: requireAuthAndAdmin },
		adminController.cleanupTempFiles.bind(adminController),
	);

	fastify.get(
		"/temp-files",
		{ preHandler: requireAuthAndAdmin },
		adminController.listTempFiles.bind(adminController),
	);

	fastify.get(
		"/files/:status",
		{ preHandler: requireAuthAndAdmin },
		adminController.listFilesByStatus.bind(adminController),
	);

	fastify.delete(
		"/files/:fileId",
		{ preHandler: requireAuthAndAdmin },
		adminController.deleteFile.bind(adminController),
	);

	fastify.delete(
		"/files/bulk-delete",
		{ preHandler: requireAuthAndAdmin },
		adminController.bulkDeleteFiles.bind(adminController),
	);

	fastify.post(
		"/users/:userId/cleanup",
		{ preHandler: requireAuthAndAdmin },
		adminController.cleanupUserFiles.bind(adminController),
	);

	// Nuevas rutas para gestión de usuarios
	fastify.get(
		"/users",
		{ preHandler: requireAuthAndAdmin },
		adminController.getUsers.bind(adminController),
	);

	fastify.get(
		"/users/:userId",
		{ preHandler: requireAuthAndAdmin },
		adminController.getUserById.bind(adminController),
	);

	fastify.patch(
		"/users/:userId/toggle-active",
		{ preHandler: requireAuthAndAdmin },
		adminController.toggleUserStatus.bind(adminController),
	);
}
