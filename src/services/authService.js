import jwt from "jsonwebtoken";
import { UserModel as User } from "../models/User.js";
import { CacheService } from "./cacheService.js";

export class AuthService {
	JWT_SECRET = "";
	JWT_EXPIRES_IN = "";
	cacheService = null;
	fastify = null;

	constructor(jwtSecret, jwtExpiresIn, fastify) {
		this.JWT_SECRET = jwtSecret;
		this.JWT_EXPIRES_IN = jwtExpiresIn;
		this.cacheService = CacheService.getInstance();
		this.fastify = fastify;
	}

	// Generar JWT token
	generateToken(payload) {
		return jwt.sign(payload, this.JWT_SECRET, {
			expiresIn: "7d",
		});
	}

	// Verificar JWT token
	verifyToken(token) {
		return jwt.verify(token, this.JWT_SECRET);
	}

	// Registrar usuario
	async register(userData) {
		try {
			// Verificar si el usuario ya existe (primero en cache, luego en DB)
			let existingUser = await this.cacheService.getUserByEmail(userData.email);
			if (!existingUser) {
				const dbUser = await User.findOne({ email: userData.email });
				if (dbUser) {
					existingUser = dbUser;
					await this.cacheService.setUserByEmail(userData.email, dbUser);
				}
			}

			if (existingUser) {
				return {
					success: false,
					message: "El usuario ya existe",
				};
			}

			// Crear nuevo usuario
			const user = new User({
				...userData,
				role: "customer",
			});

			await user.save();

			// Cachear el nuevo usuario
			await this.cacheService.setUser(user._id.toString(), user);
			await this.cacheService.setUserByEmail(user.email, user);

			// Generar token con información de autenticación
			const token = this.generateToken({
				userId: user._id.toString(),
				email: user.email,
				role: user.role,
			});

			return {
				success: true,
				message: "Usuario registrado exitosamente",
				data: {
					id: user._id.toString(),
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName ?? "",
					role: user.role,
					avatar: user.avatar,
				},
				extra: {
					token,
				},
			};
		} catch (error) {
			console.error("Error en registro:", error);
			return {
				success: false,
				message: "Error al registrar usuario",
			};
		}
	}

	// Iniciar sesión
	async login(email, password) {
		try {
			console.log({ email, password });
			// Buscar usuario (primero en cache, luego en DB)
			let user = await this.cacheService.getUserByEmail(email);
			let isFromCache = false;
			let dbUser = null;

			if (!user) {
				dbUser = await User.findOne({ email });
				if (dbUser) {
					user = dbUser;
					await this.cacheService.setUserByEmail(email, dbUser);
				}
			} else {
				isFromCache = true;
			}

			if (!user) {
				return {
					success: false,
					message: "Credenciales inválidas",
				};
			}

			console.log("pre validat password");

			// Si viene del cache, obtener el usuario de la DB para operaciones que requieren métodos de Mongoose
			if (isFromCache && !dbUser) {
				dbUser = await User.findOne({ email });
			}

			// Verificar contraseña
			let isValidPassword;
			if (isFromCache) {
				// Si viene del cache, usar el usuario de la DB para comparePassword
				if (dbUser) {
					isValidPassword = await dbUser.comparePassword(password);
				} else {
					isValidPassword = false;
				}
			} else {
				// Si viene de la DB, usar directamente
				isValidPassword = await user.comparePassword(password);
			}

			console.log({ isValidPassword });
			if (!isValidPassword) {
				return {
					success: false,
					message: "Credenciales inválidas",
				};
			}

			// Verificar si el usuario está activo
			if (isFromCache) {
				// Si viene del cache, verificar en la DB
				if (dbUser && !dbUser.isActive) {
					return {
						success: false,
						message: "Cuenta desactivada",
					};
				}
			} else {
				// Si viene de la DB, verificar directamente
				if (!user.isActive) {
					return {
						success: false,
						message: "Cuenta desactivada",
					};
				}
			}

			// Actualizar último login
			if (isFromCache) {
				// Si viene del cache, actualizar en la DB
				if (dbUser) {
					dbUser.lastLogin = new Date();
					await dbUser.save();
				}
			} else {
				// Si viene de la DB, actualizar directamente
				user.lastLogin = new Date();
				await user.save();
			}

			// Generar token usando el usuario correcto
			const userForToken = isFromCache ? dbUser : user;

			if (!userForToken._id) {
				return {
					success: false,
					message: "Error interno: usuario sin ID",
				};
			}

			const token = this.generateToken({
				userId: userForToken._id.toString(),
				email: userForToken.email,
				role: userForToken.role,
			});

			return {
				success: true,
				message: "Login exitoso",
				data: {
					id: userForToken._id.toString(),
					email: userForToken.email,
					firstName: userForToken.firstName,
					lastName: userForToken.lastName,
					role: userForToken.role,
					avatar: userForToken.avatar,
				},
				extra: {
					token,
				},
			};
		} catch (error) {
			console.error("Error en login:", error);
			return {
				success: false,
				message: "Error al iniciar sesión",
			};
		}
	}

	// Autenticación con Google
	async authenticateWithGoogle(googleUser) {
		try {
			// Buscar usuario por Google ID
			let user = await User.findOne({ googleId: googleUser.id });

			if (!user) {
				// Buscar por email
				user = await User.findOne({ email: googleUser.email });

				if (user) {
					// Actualizar usuario existente con Google ID
					user.googleId = googleUser.id;
					user.avatar = googleUser.avatar;
					await user.save();
				} else {
					console.log({ googleUser });
					// Crear nuevo usuario
					user = new User({
						email: googleUser.email,
						firstName: googleUser.firstName,
						lastName: googleUser.lastName,
						googleId: googleUser.id,
						avatar: googleUser.avatar,
						role: "customer",
					});
					await user.save();
				}
			}

			// Actualizar último login
			user.lastLogin = new Date();
			await user.save();

			// Generar token con información de autenticación
			const token = this.generateToken({
				userId: user._id.toString(),
				email: user.email,
				role: user.role,
			});

			return {
				success: true,
				message: "Autenticación con Google exitosa",
				data: {
					id: user._id.toString(),
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					avatar: user.avatar,
				},
				extra: {
					token,
				},
			};
		} catch (error) {
			console.error("Error en autenticación con Google:", error);
			return {
				success: false,
				message: "Error en autenticación con Google",
			};
		}
	}

	// Manejar callback de Google OAuth
	async handleGoogleCallback(request) {
		try {
			// Verificar que el plugin OAuth2 esté disponible
			if (!this.fastify.googleOAuth2) {
				console.error("Plugin OAuth2 no disponible");
				return {
					success: false,
					message: "OAuth2 no configurado correctamente",
				};
			}

			// Usar fastify para obtener el token de acceso
			const { token } =
				await this.fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
					request,
				);

			console.log({ token });

			// Obtener información del usuario de Google
			const userInfo = await this.getGoogleUserInfo(token.access_token);

			console.log({ userInfo });

			if (!userInfo) {
				return {
					success: false,
					message: "No se pudo obtener información del usuario de Google",
				};
			}

			console.log("third");

			// Autenticar usuario con Google
			return await this.authenticateWithGoogle(userInfo);
		} catch (error) {
			console.error("Error en callback de Google:", error);
			return {
				success: false,
				message: "Error procesando callback de Google",
			};
		}
	}

	// Obtener información del usuario de Google
	async getGoogleUserInfo(accessToken) {
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

	// Obtener usuario por ID
	async getUserById(userId) {
		try {
			return await User.findById(userId);
		} catch (error) {
			console.error("Error obteniendo usuario:", error);
			return null;
		}
	}

	// Verificar si el usuario tiene un rol específico
	async hasRole(userId, role) {
		try {
			const user = await User.findById(userId);
			return user?.role === role;
		} catch (error) {
			console.error("Error verificando rol:", error);
			return false;
		}
	}

	// Verificar si el usuario puede cambiar contraseña
	async canChangePassword(userId) {
		try {
			const user = await User.findById(userId);
			if (!user) {
				return false;
			}
			// Solo usuarios sin googleId pueden cambiar contraseña
			return !user.googleId;
		} catch (error) {
			console.error("Error verificando si puede cambiar contraseña:", error);
			return false;
		}
	}

	// Cambiar contraseña
	async changePassword(userId, currentPassword, newPassword) {
		try {
			const user = await User.findById(userId);

			if (!user) {
				return {
					success: false,
					message: "Usuario no encontrado",
				};
			}

			// Verificar si el usuario puede cambiar contraseña
			if (user.googleId) {
				return {
					success: false,
					message:
						"Los usuarios que se registraron con Google no pueden cambiar su contraseña desde esta aplicación",
				};
			}

			// Verificar contraseña actual
			const isValidPassword = await user.comparePassword(currentPassword);
			if (!isValidPassword) {
				return {
					success: false,
					message: "La contraseña actual es incorrecta",
				};
			}

			// Validar nueva contraseña
			if (!newPassword || newPassword.length < 6) {
				return {
					success: false,
					message: "La nueva contraseña debe tener al menos 6 caracteres",
				};
			}

			// Actualizar contraseña
			user.password = newPassword;
			await user.save();

			// Limpiar cache
			this.cacheService.invalidateUser(userId);
			this.cacheService.invalidateUserByEmail(user.email);

			return {
				success: true,
				message: "Contraseña cambiada exitosamente",
			};
		} catch (error) {
			console.error("Error cambiando contraseña:", error);
			return {
				success: false,
				message: "Error al cambiar contraseña",
			};
		}
	}

	// Actualizar perfil
	async updateProfile(userId, updateData) {
		try {
			console.log("🔄 AuthService.updateProfile - userId:", userId);
			console.log("📝 AuthService.updateProfile - updateData:", updateData);

			const user = await User.findById(userId);

			if (!user) {
				console.log("❌ Usuario no encontrado en BD");
				return {
					success: false,
					message: "Usuario no encontrado",
				};
			}

			console.log("✅ Usuario encontrado:", user.email);

			// Actualizar campos permitidos
			if (updateData.firstName !== undefined) {
				user.firstName = updateData.firstName;
				console.log("📝 Actualizando firstName:", updateData.firstName);
			}
			if (updateData.lastName !== undefined) {
				user.lastName = updateData.lastName;
				console.log("📝 Actualizando lastName:", updateData.lastName);
			}

			// Si avatar viene explícitamente como null, límpialo
			if (Object.prototype.hasOwnProperty.call(updateData, "avatar")) {
				user.avatar = updateData.avatar;
				console.log("📝 Actualizando avatar:", updateData.avatar);
			}
			// Si avatarKey viene explícitamente como null, límpialo
			if (Object.prototype.hasOwnProperty.call(updateData, "avatarKey")) {
				user.avatarKey = updateData.avatarKey;
				console.log("📝 Actualizando avatarKey:", updateData.avatarKey);
			}

			await user.save();
			console.log("✅ Usuario guardado en BD");

			// Limpiar cache completamente para forzar actualización
			console.log("🗑️ Limpiando cache...");
			await this.cacheService.invalidateUser(userId);
			await this.cacheService.invalidateUserByEmail(user.email);

			// Esperar un poco para asegurar que el cache se limpie
			await new Promise((resolve) => setTimeout(resolve, 100));

			console.log("✅ Cache limpiado");

			return {
				success: true,
				message: "Perfil actualizado exitosamente",
				data: {
					id: user._id.toString(),
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					avatar: user.avatar,
					avatarKey: user.avatarKey,
				},
			};
		} catch (error) {
			console.error("❌ Error actualizando perfil:", error);
			return {
				success: false,
				message: "Error al actualizar perfil",
			};
		}
	}
}
