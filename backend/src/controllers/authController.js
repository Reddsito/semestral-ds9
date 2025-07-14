import { AuthService } from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export class AuthController {
	static authService = null;

	static initializeAuthService(jwtSecret, jwtExpiresIn) {
		if (!AuthController.authService) {
			AuthController.authService = AuthService.getInstance(
				jwtSecret,
				jwtExpiresIn,
			);
		}
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

	// Iniciar OAuth con Google
	static async googleAuth(request, reply) {
		try {
			const { GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL } = process.env;

			if (!GOOGLE_CLIENT_ID) {
				return reply.status(500).send(errorResponse("OAuth no configurado"));
			}

			// Construir URL de autorización de Google
			const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
			authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
			authUrl.searchParams.set("redirect_uri", GOOGLE_CALLBACK_URL);
			authUrl.searchParams.set("response_type", "code");
			authUrl.searchParams.set("scope", "openid profile email");
			authUrl.searchParams.set("access_type", "offline");

			request.log.info("Redirigiendo a Google OAuth");
			return reply.redirect(authUrl.toString());
		} catch (error) {
			request.log.error("Error iniciando OAuth con Google:", error);
			return reply
				.status(500)
				.send(errorResponse("Error iniciando autenticación con Google"));
		}
	}

	// Callback de Google OAuth
	static async googleCallback(request, reply) {
		try {
			const { code } = request.query;
			const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } =
				process.env;

			request.log.info("OAuth callback iniciado");
			request.log.info(`Code recibido: ${code ? "SÍ" : "NO"}`);

			if (!code) {
				request.log.error("No se recibió código de autorización");
				return reply
					.status(400)
					.send(errorResponse("Código de autorización no recibido"));
			}

			request.log.info("Intercambiando código por token...");

			// Intercambiar código por token de acceso
			const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: GOOGLE_CLIENT_ID,
					client_secret: GOOGLE_CLIENT_SECRET,
					code: code,
					grant_type: "authorization_code",
					redirect_uri: GOOGLE_CALLBACK_URL,
				}),
			});

			request.log.info(`Token response status: ${tokenResponse.status}`);

			if (!tokenResponse.ok) {
				const errorData = await tokenResponse.text();
				request.log.error("Error intercambiando código por token:", errorData);
				return reply
					.status(400)
					.send(errorResponse("Error obteniendo token de Google"));
			}

			const tokenData = await tokenResponse.json();
			const accessToken = tokenData.access_token;

			request.log.info("Token obtenido, obteniendo información del usuario...");

			// Obtener información del usuario de Google
			const googleUser = await this.getGoogleUserInfo(accessToken);

			if (!googleUser) {
				request.log.error(
					"No se pudo obtener información del usuario de Google",
				);
				return reply
					.status(400)
					.send(
						errorResponse(
							"No se pudo obtener información del usuario de Google",
						),
					);
			}

			request.log.info(`OAuth callback exitoso para: ${googleUser.email}`);

			const result = await AuthController.authService.authenticateWithGoogle(
				googleUser,
			);

			if (result.success) {
				// Redirigir al frontend con el token
				const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
				const redirectUrl = `${frontendUrl}/profile?token=${result.extra.token}`;

				request.log.info(`Redirigiendo a: ${redirectUrl}`);
				return reply.redirect(redirectUrl);
			} else {
				request.log.error(`Error en authenticateWithGoogle: ${result.message}`);
				return reply.status(400).send(errorResponse(result.message));
			}
		} catch (error) {
			request.log.error("Error en callback de Google:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Obtener información del usuario de Google
	static async getGoogleUserInfo(accessToken) {
		try {
			const response = await fetch(
				"https://openidconnect.googleapis.com/v1/userinfo",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok) {
				const errorBody = await response.text();
				console.error(
					`Google userinfo error: ${response.status} - ${errorBody}`,
				);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const userData = await response.json();

			return {
				id: userData.sub,
				email: userData.email,
				firstName: userData.given_name,
				lastName: userData.family_name,
				avatar: userData.picture,
			};
		} catch (error) {
			console.error("Error obteniendo información de Google:", error);
			return null;
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
