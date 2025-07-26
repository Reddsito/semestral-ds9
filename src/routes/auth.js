import { AuthController } from "../controllers/authController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { authValidations } from "../validations/authValidations.js";

export async function authRoutes(fastify) {
	// Registrar usuario
	fastify.post(
		"/register",
		{
			schema: authValidations.register,
		},
		AuthController.register,
	);

	// Iniciar sesión
	fastify.post(
		"/login",
		{
			schema: authValidations.login,
		},
		AuthController.login,
	);

	// Obtener perfil del usuario (requiere autenticación)
	fastify.get(
		"/profile",
		{
			preHandler: authenticateToken,
		},
		AuthController.getProfile,
	);

	// Obtener usuario por token
	fastify.get(
		"/me",
		{
			preHandler: authenticateToken,
		},
		AuthController.getUserByToken,
	);

	// Verificar token
	fastify.get(
		"/verify",
		{
			preHandler: authenticateToken,
		},
		AuthController.verifyToken,
	);

	// Callback de Google OAuth
	fastify.get("/google/callback", AuthController.googleCallback);

	// Cerrar sesión
	fastify.post(
		"/logout",
		{
			preHandler: authenticateToken,
		},
		AuthController.logout,
	);

	// Cambiar contraseña
	fastify.post(
		"/change-password",
		{
			schema: authValidations.changePassword,
			preHandler: authenticateToken,
		},
		AuthController.changePassword,
	);

	// Actualizar perfil
	fastify.put(
		"/profile",
		{
			schema: authValidations.updateProfile,
			preHandler: authenticateToken,
		},
		AuthController.updateProfile,
	);

	// Subir avatar
	fastify.post(
		"/avatar/upload",
		{
			preHandler: authenticateToken,
		},
		AuthController.uploadAvatar,
	);

	// Eliminar avatar
	fastify.delete(
		"/avatar",
		{
			preHandler: authenticateToken,
		},
		AuthController.deleteAvatar,
	);

	// Obtener URL firmada del avatar
	fastify.get(
		"/avatar/signed-url",
		{
			preHandler: authenticateToken,
		},
		AuthController.getAvatarSignedUrl,
	);

	// Ruta protegida de ejemplo (solo admin)
	fastify.get(
		"/admin",
		{
			preHandler: [authenticateToken, requireAdmin],
		},
		async (request, reply) => {
			return reply.send({
				success: true,
				message: "Acceso a área administrativa",
				data: {
					message: "Bienvenido al panel de administración",
				},
			});
		},
	);
}
