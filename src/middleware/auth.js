import { AuthService } from "../services/authService.js";

let authService = null;

console.log("📦 AuthService importado:", !!AuthService);

export const initializeAuthMiddleware = (jwtSecret, jwtExpiresIn, fastify) => {
	console.log("🔧 Inicializando AuthService con:", {
		jwtSecret: !!jwtSecret,
		jwtExpiresIn,
		fastify: !!fastify,
	});
	authService = new AuthService(jwtSecret, jwtExpiresIn, fastify);
	console.log("✅ AuthService inicializado");
};

// Middleware para verificar JWT token
export const authenticateToken = async (request, reply) => {
	try {
		console.log("🔐 Middleware de autenticación ejecutándose");
		const authHeader = request.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

		console.log("📋 Auth header:", authHeader);
		console.log("🎫 Token:", token ? "Presente" : "Ausente");

		if (!token) {
			console.log("❌ No hay token");
			return reply.status(401).send({
				success: false,
				message:
					"Token de acceso requerido. Verifica que hayas iniciado sesión correctamente.",
			});
		}

		const decoded = authService.verifyToken(token);
		request.user = decoded;
		console.log("✅ Token verificado, usuario:", decoded);

		return;
	} catch (error) {
		console.error("❌ Error verificando token:", error);
		return reply.status(403).send({
			success: false,
			message:
				"Token inválido o expirado. Por favor, inicia sesión nuevamente.",
		});
	}
};

// Middleware para verificar roles específicos
export const requireRole = (roles) => {
	return async (request, reply) => {
		try {
			console.log("🔐 Verificando roles:", {
				user: request.user,
				requiredRoles: roles,
			});

			if (!request.user) {
				console.log("❌ No hay usuario autenticado");
				return reply.status(401).send({
					success: false,
					message: "Autenticación requerida",
				});
			}

			if (!roles.includes(request.user.role)) {
				console.log("❌ Usuario no tiene permisos:", {
					userRole: request.user.role,
					requiredRoles: roles,
				});
				return reply.status(403).send({
					success: false,
					message: "Permisos insuficientes",
				});
			}

			console.log("✅ Usuario tiene permisos:", request.user.role);
			return;
		} catch (error) {
			console.error("❌ Error verificando permisos:", error);
			return reply.status(500).send({
				success: false,
				message: "Error verificando permisos",
			});
		}
	};
};

export const requireAdmin = requireRole(["admin"]);

// Middleware para verificar si es moderador o admin
export const requireModerator = requireRole(["admin", "moderator"]);

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (request, reply) => {
	try {
		const authHeader = request.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1];

		if (token) {
			const decoded = authService.verifyToken(token);
			request.user = decoded;
		}

		return;
	} catch (error) {
		// No hacer nada, continuar sin autenticación
		return;
	}
};

// Alias para authenticateToken
export const authMiddleware = authenticateToken;
