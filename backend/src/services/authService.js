import jwt from "jsonwebtoken";
import { UserModel as User } from "../models/User.js";
import { CacheService } from "./cacheService.js";

export class AuthService {
	static instance = null;
	JWT_SECRET = "";
	JWT_EXPIRES_IN = "";
	cacheService = null;

	constructor(jwtSecret, jwtExpiresIn) {
		this.JWT_SECRET = jwtSecret;
		this.JWT_EXPIRES_IN = jwtExpiresIn;
		this.cacheService = CacheService.getInstance();
	}

	static getInstance(jwtSecret, jwtExpiresIn) {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService(
				jwtSecret || process.env.JWT_SECRET || "fallback-secret",
				jwtExpiresIn || process.env.JWT_EXPIRES_IN || "7d",
			);
		}
		return AuthService.instance;
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

			// Generar token
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
					lastName: user.lastName,
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
			// Buscar usuario (primero en cache, luego en DB)
			let user = await this.cacheService.getUserByEmail(email);
			if (!user) {
				const dbUser = await User.findOne({ email });
				if (dbUser) {
					user = dbUser;
					await this.cacheService.setUserByEmail(email, dbUser);
				}
			}

			if (!user) {
				return {
					success: false,
					message: "Credenciales inválidas",
				};
			}

			// Verificar contraseña
			const isValidPassword = await user.comparePassword(password);
			if (!isValidPassword) {
				return {
					success: false,
					message: "Credenciales inválidas",
				};
			}

			// Verificar si el usuario está activo
			if (!user.isActive) {
				return {
					success: false,
					message: "Cuenta desactivada",
				};
			}

			// Actualizar último login (solo si viene de la DB)
			if ("save" in user) {
				user.lastLogin = new Date();
				await user.save();
			}

			// Generar token
			if (!user._id) {
				return {
					success: false,
					message: "Error interno: usuario sin ID",
				};
			}
			const token = this.generateToken({
				userId: user._id.toString(),
				email: user.email,
				role: user.role,
			});

			return {
				success: true,
				message: "Login exitoso",
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

			// Generar token
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

			// Verificar contraseña actual
			const isValidPassword = await user.comparePassword(currentPassword);
			if (!isValidPassword) {
				return {
					success: false,
					message: "La contraseña actual es incorrecta",
				};
			}

			// Actualizar contraseña
			user.password = newPassword;
			await user.save();

			// Limpiar cache
			this.cacheService.deleteUser(userId);
			this.cacheService.deleteUserByEmail(user.email);

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
			const user = await User.findById(userId);

			if (!user) {
				return {
					success: false,
					message: "Usuario no encontrado",
				};
			}

			// Actualizar campos permitidos
			if (updateData.firstName) user.firstName = updateData.firstName;
			if (updateData.lastName) user.lastName = updateData.lastName;
			if (updateData.avatar) user.avatar = updateData.avatar;

			await user.save();

			// Limpiar cache
			this.cacheService.deleteUser(userId);
			this.cacheService.deleteUserByEmail(user.email);

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
				},
			};
		} catch (error) {
			console.error("Error actualizando perfil:", error);
			return {
				success: false,
				message: "Error al actualizar perfil",
			};
		}
	}
}
