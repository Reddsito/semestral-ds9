export class CacheService {
	static instance = null;
	fastify = null;

	constructor() {}

	static getInstance() {
		if (!CacheService.instance) {
			CacheService.instance = new CacheService();
		}
		return CacheService.instance;
	}

	// Inicializar con la instancia de Fastify
	initialize(fastify) {
		this.fastify = fastify;
		console.log("CacheService inicializado con cache local");
	}

	// Cache de usuarios por ID
	setUser(userId, user) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		const key = `user:${userId}`;
		this.fastify.cache.set(key, user, 600, (err) => {
			if (err) {
				console.error("Error cacheando usuario:", err);
			} else {
				console.log(`Usuario cacheado: ${userId}`);
			}
		});
	}

	getUser(userId) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return Promise.resolve(undefined);
		}
		const key = `user:${userId}`;
		return new Promise((resolve) => {
			this.fastify.cache.get(key, (err, user) => {
				if (err) {
					console.error("Error obteniendo usuario del cache:", err);
					resolve(undefined);
				} else if (user) {
					console.log(`Usuario desde cache: ${userId}`);
					resolve(user);
				} else {
					resolve(undefined);
				}
			});
		});
	}

	// Cache de usuarios por email
	setUserByEmail(email, user) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		const key = `user:email:${email}`;
		this.fastify.cache.set(key, user, 600, (err) => {
			if (err) {
				console.error("Error cacheando usuario por email:", err);
			} else {
				console.log(`Usuario por email cacheado: ${email}`);
			}
		});
	}

	getUserByEmail(email) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return Promise.resolve(undefined);
		}
		const key = `user:email:${email}`;
		return new Promise((resolve) => {
			this.fastify.cache.get(key, (err, user) => {
				if (err) {
					console.error("Error obteniendo usuario por email del cache:", err);
					resolve(undefined);
				} else if (user) {
					console.log(`Usuario por email desde cache: ${email}`);
					resolve(user);
				} else {
					resolve(undefined);
				}
			});
		});
	}

	// Cache de usuarios por Google ID
	setUserByGoogleId(googleId, user) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		const key = `user:google:${googleId}`;
		this.fastify.cache.set(key, user, 600, (err) => {
			if (err) {
				console.error("Error cacheando usuario por Google ID:", err);
			} else {
				console.log(`Usuario por Google ID cacheado: ${googleId}`);
			}
		});
	}

	getUserByGoogleId(googleId) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return Promise.resolve(undefined);
		}
		const key = `user:google:${googleId}`;
		return new Promise((resolve) => {
			this.fastify.cache.get(key, (err, user) => {
				if (err) {
					console.error(
						"Error obteniendo usuario por Google ID del cache:",
						err,
					);
					resolve(undefined);
				} else if (user) {
					console.log(`Usuario por Google ID desde cache: ${googleId}`);
					resolve(user);
				} else {
					resolve(undefined);
				}
			});
		});
	}

	// Invalidar cache de usuario (cuando se actualiza)
	async invalidateUser(userId) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		try {
			const user = await this.getUser(userId);
			if (user) {
				// Invalidar todas las referencias del usuario
				this.fastify.cache.delete(`user:${userId}`, (err) => {
					if (err) console.error("Error invalidando cache de usuario:", err);
				});
				this.fastify.cache.delete(`user:email:${user.email}`, (err) => {
					if (err) console.error("Error invalidando cache de email:", err);
				});
				if (user.googleId) {
					this.fastify.cache.delete(`user:google:${user.googleId}`, (err) => {
						if (err)
							console.error("Error invalidando cache de Google ID:", err);
					});
				}
				console.log(`Cache invalidado para usuario: ${userId}`);
			}
		} catch (err) {
			console.error("Error invalidando cache de usuario:", err);
		}
	}

	// Invalidar cache por email
	invalidateUserByEmail(email) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		this.fastify.cache.delete(`user:email:${email}`, (err) => {
			if (err) {
				console.error("Error invalidando cache por email:", err);
			} else {
				console.log(`Cache invalidado por email: ${email}`);
			}
		});
	}

	// Invalidar cache por Google ID
	invalidateUserByGoogleId(googleId) {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		this.fastify.cache.delete(`user:google:${googleId}`, (err) => {
			if (err) {
				console.error("Error invalidando cache por Google ID:", err);
			} else {
				console.log(`Cache invalidado por Google ID: ${googleId}`);
			}
		});
	}

	// Limpiar todo el cache
	flush() {
		if (!this.fastify) {
			console.warn("CacheService no inicializado");
			return;
		}
		this.fastify.cache.clear((err) => {
			if (err) {
				console.error("Error limpiando cache:", err);
			} else {
				console.log("Cache completamente limpiado");
			}
		});
	}

	// Verificar si un usuario está activo (desde cache o DB)
	async isUserActive(userId) {
		const user = await this.getUser(userId);
		if (user) {
			return user.isActive;
		}
		return false; // Si no está en cache, asumimos que no está activo
	}

	// Verificar si un usuario existe y está activo
	async isUserValid(userId) {
		const user = await this.getUser(userId);
		return user ? user.isActive : false;
	}
}
