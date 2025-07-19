import { AuthService } from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export class AuthController {
	static authService = null;

	static initializeAuthService(jwtSecret, jwtExpiresIn, fastify) {
		AuthController.authService = new AuthService(
			jwtSecret,
			jwtExpiresIn,
			fastify,
		);
	}

	// Registrar usuario
	static async register(request, reply) {
		try {
			const { email, password, firstName, lastName } = request.body;

			request.log.info(`Intento de registro: ${email}`);

			// Validaciones básicas
			if (!email || !password || !firstName || !lastName) {
				request.log.warn(`Registro fallido: campos faltantes para ${email}`);
				return reply
					.status(400)
					.send(errorResponse("Todos los campos son requeridos"));
			}

			if (password.length < 6) {
				request.log.warn(
					`Registro fallido: contraseña muy corta para ${email}`,
				);
				return reply
					.status(400)
					.send(
						errorResponse("La contraseña debe tener al menos 6 caracteres"),
					);
			}

			const result = await AuthController.authService.register({
				email,
				password,
				firstName,
				lastName,
			});

			if (result.success) {
				request.log.info(`Usuario registrado exitosamente: ${email}`);
				return reply
					.status(201)
					.send(
						successResponse(
							"Usuario registrado exitosamente",
							result.data,
							result.extra,
						),
					);
			} else {
				request.log.warn(`Registro fallido: ${result.message} para ${email}`);
				return reply.status(400).send(errorResponse(result.message));
			}
		} catch (error) {
			request.log.error(
				`Error en registro para ${request.body?.email}:`,
				error,
			);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Iniciar sesión
	static async login(request, reply) {
		try {
			const { email, password } = request.body;

			request.log.info(`Intento de login: ${email}`);

			// Validaciones básicas
			if (!email || !password) {
				request.log.warn(`Login fallido: credenciales faltantes para ${email}`);
				return reply
					.status(400)
					.send(errorResponse("Email y contraseña son requeridos"));
			}

			const result = await AuthController.authService.login(email, password);

			if (result.success) {
				request.log.info(`Login exitoso: ${email}`);
				return reply
					.status(200)
					.send(successResponse("Login exitoso", result.data, result.extra));
			} else {
				request.log.warn(`Login fallido: ${result.message} para ${email}`);
				return reply.status(401).send(errorResponse(result.message));
			}
		} catch (error) {
			request.log.error(`Error en login para ${request.body?.email}:`, error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Obtener perfil del usuario
	static async getProfile(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			const userData = await AuthController.authService.getUserById(
				user.userId,
			);

			if (!userData) {
				return reply.status(404).send(errorResponse("Usuario no encontrado"));
			}

			return reply.status(200).send(
				successResponse("Perfil obtenido exitosamente", {
					id: userData._id,
					email: userData.email,
					firstName: userData.firstName,
					lastName: userData.lastName,
					role: userData.role,
					avatar: userData.avatar,
					lastLogin: userData.lastLogin,
				}),
			);
		} catch (error) {
			console.error("Error obteniendo perfil:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Obtener usuario por token
	static async getUserByToken(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Token inválido"));
			}

			const userData = await AuthController.authService.getUserById(
				user.userId,
			);

			if (!userData) {
				return reply.status(404).send(errorResponse("Usuario no encontrado"));
			}

			return reply.status(200).send(
				successResponse("Usuario obtenido exitosamente", {
					id: userData._id,
					email: userData.email,
					firstName: userData.firstName,
					lastName: userData.lastName,
					role: userData.role,
					avatar: userData.avatar,
					lastLogin: userData.lastLogin,
				}),
			);
		} catch (error) {
			console.error("Error obteniendo usuario por token:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Callback de Google OAuth
	static async googleCallback(request, reply) {
		try {
			const { code } = request.query;

			if (!code) {
				request.log.warn("Callback de Google sin código de autorización");
				return reply
					.status(400)
					.send(errorResponse("Código de autorización requerido"));
			}

			// Usar el servicio para manejar el callback
			const result = await AuthController.authService.handleGoogleCallback(
				request,
			);

			if (result.success) {
				request.log.info(`Login exitoso con Google: ${result.data.email}`);

				// Redirigir al frontend principal con el token en la URL
				const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
				const redirectUrl = `${frontendUrl}/?token=${
					result.extra.token
				}&user=${encodeURIComponent(JSON.stringify(result.data))}`;

				return reply.redirect(redirectUrl);
			} else {
				request.log.warn(`Login fallido con Google: ${result.message}`);
				return reply.status(400).send(errorResponse(result.message));
			}
		} catch (error) {
			request.log.error("Error en callback de Google:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Verificar token
	static async verifyToken(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Token inválido"));
			}

			return reply.status(200).send(
				successResponse("Token válido", {
					userId: user.userId,
					email: user.email,
					role: user.role,
				}),
			);
		} catch (error) {
			console.error("Error verificando token:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Cerrar sesión (opcional, ya que JWT es stateless)
	static async logout(request, reply) {
		try {
			return reply
				.status(200)
				.send(successResponse("Sesión cerrada exitosamente"));
		} catch (error) {
			console.error("Error en logout:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Cambiar contraseña
	static async changePassword(request, reply) {
		try {
			const { currentPassword, newPassword } = request.body;
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			const result = await AuthController.authService.changePassword(
				user.userId,
				currentPassword,
				newPassword,
			);

			if (result.success) {
				return reply
					.status(200)
					.send(
						successResponse("Contraseña cambiada exitosamente", result.data),
					);
			} else {
				return reply.status(400).send(errorResponse(result.message));
			}
		} catch (error) {
			console.error("Error cambiando contraseña:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Actualizar perfil
	static async updateProfile(request, reply) {
		try {
			const { firstName, lastName, avatar } = request.body;
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			const result = await AuthController.authService.updateProfile(
				user.userId,
				{ firstName, lastName, avatar },
			);

			if (result.success) {
				return reply
					.status(200)
					.send(
						successResponse("Perfil actualizado exitosamente", result.data),
					);
			} else {
				return reply.status(400).send(errorResponse(result.message));
			}
		} catch (error) {
			console.error("Error actualizando perfil:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}
}
