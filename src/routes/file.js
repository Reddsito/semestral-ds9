import { FileController } from "../controllers/fileController.js";
import { authenticateToken } from "../middleware/auth.js";

export async function fileRoutes(fastify) {
	const fileController = new FileController();

	// Subir archivo 3D (requiere autenticación)
	fastify.post(
		"/upload",
		{
			preHandler: authenticateToken,
		},
		fileController.uploadFile.bind(fileController),
	);

	// Subir imagen (requiere autenticación)
	fastify.post(
		"/upload-image",
		{
			preHandler: authenticateToken,
		},
		fileController.uploadImage.bind(fileController),
	);

	// Obtener archivos del usuario (requiere autenticación)
	fastify.get(
		"/user",
		{
			preHandler: authenticateToken,
		},
		fileController.getUserFiles.bind(fileController),
	);

	// Obtener archivo específico (requiere autenticación)
	fastify.get(
		"/:fileId",
		{
			preHandler: authenticateToken,
		},
		fileController.getFile.bind(fileController),
	);

	// Eliminar archivo (requiere autenticación)
	fastify.delete(
		"/:fileId",
		{
			preHandler: authenticateToken,
		},
		fileController.deleteFile.bind(fileController),
	);

	// Validar archivo (requiere autenticación)
	fastify.post(
		"/:fileId/validate",
		{
			preHandler: authenticateToken,
		},
		fileController.validateFile.bind(fileController),
	);
}
