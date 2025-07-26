import { AuthService } from "../services/authService.js";

let authService = null;

export const initializeAuthMiddleware = (jwtSecret, jwtExpiresIn, fastify) => {
	authService = new AuthService(jwtSecret, jwtExpiresIn, fastify);
};

// Middleware para verificar JWT token
export const authenticateToken = async (request, reply) => {
	try {
		const authHeader = request.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

		if (!token) {
			return reply.status(401).send({
				success: false,
				message:
					"Token de acceso requerido. Verifica que hayas iniciado sesión correctamente.",
			});
		}

		const decoded = authService.verifyToken(token);
		request.user = decoded;

		return;
	} catch (error) {
		console.error("Error verificando token:", error);
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
			if (!request.user) {
				return reply.status(401).send({
					success: false,
					message: "Autenticación requerida",
				});
			}

			if (!roles.includes(request.user.role)) {
				return reply.status(403).send({
					success: false,
					message: "Permisos insuficientes",
				});
			}

			return;
		} catch (error) {
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
