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

	// Verificar token
	fastify.get(
		"/verify",
		{
			preHandler: authenticateToken,
		},
		AuthController.verifyToken,
	);

	// Iniciar OAuth con Google
	fastify.get("/google", AuthController.googleAuth);

	// Callback de Google OAuth
	fastify.get("/google/callback", AuthController.googleCallback);

	// Callback de Google OAuth (POST para compatibilidad)
	fastify.post(
		"/google/callback",
		{
			schema: authValidations.googleCallback,
		},
		AuthController.googleCallback,
	);

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
