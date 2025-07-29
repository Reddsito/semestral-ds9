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

			// Determinar tipo de autenticación
			const authType = userData.googleId ? "google" : "credentials";

			return reply.status(200).send(
				successResponse("Perfil obtenido exitosamente", {
					id: userData._id,
					email: userData.email,
					firstName: userData.firstName,
					lastName: userData.lastName,
					role: userData.role,
					avatar: userData.avatar,
					lastLogin: userData.lastLogin,
					authType: authType,
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

			// Determinar tipo de autenticación
			const authType = userData.googleId ? "google" : "credentials";

			return reply.status(200).send(
				successResponse("Usuario obtenido exitosamente", {
					id: userData._id,
					email: userData.email,
					firstName: userData.firstName,
					lastName: userData.lastName,
					role: userData.role,
					avatar: userData.avatar,
					lastLogin: userData.lastLogin,
					authType: authType,
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
					authType: user.authType,
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

	// Verificar si el usuario puede cambiar contraseña
	static async canChangePassword(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			const canChange = await AuthController.authService.canChangePassword(
				user.userId,
			);

			return reply.status(200).send(
				successResponse("Verificación completada", {
					canChangePassword: canChange,
					authType: user.authType,
				}),
			);
		} catch (error) {
			console.error("Error verificando si puede cambiar contraseña:", error);
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
			const { firstName, lastName, avatar, avatarKey } = request.body;
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			console.log("🔄 Actualizando perfil para usuario:", user.userId);
			console.log("📝 Datos a actualizar:", {
				firstName,
				lastName,
				avatar,
				avatarKey,
			});

			const result = await AuthController.authService.updateProfile(
				user.userId,
				{ firstName, lastName, avatar, avatarKey },
			);

			console.log("📊 Resultado de actualización:", result);

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

	// Subir avatar
	static async uploadAvatar(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			console.log("📤 Iniciando subida de avatar para usuario:", user.userId);

			const file = await request.file();

			console.log("📁 Archivo recibido:", {
				hasFile: !!file,
				filename: file?.filename,
				mimetype: file?.mimetype,
				size: file?.size,
			});

			if (!file) {
				return reply
					.status(400)
					.send(errorResponse("No se proporcionó ningún archivo"));
			}

			// Leer el buffer del archivo para obtener el tamaño real
			const chunks = [];
			for await (const chunk of file.file) {
				chunks.push(chunk);
			}
			const buffer = Buffer.concat(chunks);
			const actualFileSize = buffer.length;

			console.log("📊 Información del archivo procesado:", {
				filename: file.filename,
				mimetype: file.mimetype,
				originalSize: file.size,
				actualSize: actualFileSize,
			});

			// Crear objeto de archivo con el tamaño correcto
			const processedFile = {
				...file,
				size: actualFileSize,
				buffer: buffer,
			};

			// Importar StorageService
			const { StorageService } = await import("../services/storageService.js");
			const storageService = new StorageService();

			console.log("🔄 Subiendo avatar a storage...");

			// Subir avatar
			const uploadResult = await storageService.uploadAvatar(
				processedFile,
				user.userId,
			);

			console.log("📊 Resultado de subida:", uploadResult);

			if (!uploadResult.success) {
				return reply.status(400).send(errorResponse(uploadResult.message));
			}

			// Crear registro en la tabla File
			const { File } = await import("../models/File.js");
			const fileData = {
				userId: user.userId,
				originalName: file.filename,
				filename: uploadResult.data.avatarKey, // Usar avatarKey como filename
				filePath: uploadResult.data.avatarKey,
				fileSize: uploadResult.data.fileSize || actualFileSize, // Usar fileSize del resultado o el tamaño real
				mimeType: uploadResult.data.mimeType,
				type: "avatar",
				isValid: true, // Los avatares son válidos por defecto
			};

			const savedFile = await File.create(fileData);
			console.log("📁 Avatar guardado en BD:", savedFile);

			console.log("🔄 Actualizando perfil del usuario...");

			// Actualizar perfil del usuario con el nuevo avatar
			const updateResult = await AuthController.authService.updateProfile(
				user.userId,
				{
					avatar: uploadResult.data.avatarUrl, // Ya es URL firmada
					avatarKey: uploadResult.data.avatarKey,
				},
			);

			console.log("📊 Resultado de actualización:", updateResult);

			if (!updateResult.success) {
				return reply.status(400).send(errorResponse(updateResult.message));
			}

			console.log("✅ Avatar subido exitosamente");

			return reply.status(200).send(
				successResponse("Avatar subido exitosamente", {
					avatar: uploadResult.data.avatarUrl,
					avatarKey: uploadResult.data.avatarKey,
					fileId: savedFile._id, // Incluir el ID del file creado
				}),
			);
		} catch (error) {
			console.error("❌ Error subiendo avatar:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Eliminar avatar
	static async deleteAvatar(request, reply) {
		try {
			const user = request.user;

			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			// Obtener usuario actual para verificar si tiene avatar
			const userData = await AuthController.authService.getUserById(
				user.userId,
			);

			if (!userData) {
				return reply.status(404).send(errorResponse("Usuario no encontrado"));
			}

			if (!userData.avatarKey) {
				return reply
					.status(400)
					.send(errorResponse("No tienes un avatar para eliminar"));
			}

			// Importar StorageService
			const { StorageService } = await import("../services/storageService.js");
			const storageService = new StorageService();

			// Eliminar avatar del storage
			const deleteResult = await storageService.deleteAvatar(
				userData.avatarKey,
			);

			if (!deleteResult.success) {
				return reply.status(400).send(errorResponse(deleteResult.message));
			}

			// Eliminar registro de la tabla File
			const { File } = await import("../models/File.js");
			const fileToDelete = await File.findOne({
				userId: user.userId,
				filename: userData.avatarKey,
				type: "avatar",
			});

			if (fileToDelete) {
				await File.findByIdAndDelete(fileToDelete._id);
				console.log("📁 Avatar eliminado de la BD:", fileToDelete._id);
			}

			// Actualizar perfil del usuario eliminando el avatar
			const updateResult = await AuthController.authService.updateProfile(
				user.userId,
				{
					avatar: null,
					avatarKey: null,
				},
			);

			if (!updateResult.success) {
				return reply.status(400).send(errorResponse(updateResult.message));
			}

			return reply
				.status(200)
				.send(successResponse("Avatar eliminado exitosamente"));
		} catch (error) {
			console.error("Error eliminando avatar:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}

	// Obtener URL firmada del avatar
	static async getAvatarSignedUrl(request, reply) {
		try {
			const user = request.user;
			if (!user) {
				return reply.status(401).send(errorResponse("Usuario no autenticado"));
			}

			// Obtener el usuario completo para el avatarKey
			const userData = await AuthController.authService.getUserById(
				user.userId,
			);
			if (!userData || !userData.avatarKey) {
				return reply.status(404).send(errorResponse("No tienes avatar"));
			}

			const { StorageService } = await import("../services/storageService.js");
			const storageService = new StorageService();
			const result = await storageService.getAvatarUrl(
				userData.avatarKey,
				3600,
			);

			if (!result.success) {
				return reply.status(400).send(errorResponse(result.message));
			}

			return reply.send(successResponse("URL firmada generada", result.data));
		} catch (error) {
			console.error("Error generando URL firmada de avatar:", error);
			return reply
				.status(500)
				.send(errorResponse("Error interno del servidor"));
		}
	}
}
