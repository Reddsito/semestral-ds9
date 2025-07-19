// Esquemas de validación para rutas de autenticación
export const authValidations = {
	// Esquema para registro de usuario
	register: {
		body: {
			type: "object",
			required: ["email", "password", "firstName", "lastName"],
			properties: {
				email: {
					type: "string",
					format: "email",
				},
				password: {
					type: "string",
					minLength: 6,
				},
				firstName: {
					type: "string",
					minLength: 1,
				},
				lastName: {
					type: "string",
					minLength: 1,
				},
			},
		},
	},

	// Esquema para login
	login: {
		body: {
			type: "object",
			required: ["email", "password"],
			properties: {
				email: {
					type: "string",
					format: "email",
				},
				password: {
					type: "string",
				},
			},
		},
	},

	// Esquema para callback de Google OAuth
	googleCallback: {
		body: {
			type: "object",
			required: ["user"],
			properties: {
				user: {
					type: "object",
					required: ["id", "email", "firstName", "lastName"],
					properties: {
						id: {
							type: "string",
						},
						email: {
							type: "string",
							format: "email",
						},
						firstName: {
							type: "string",
						},
						lastName: {
							type: "string",
						},
						avatar: {
							type: "string",
						},
					},
				},
			},
		},
	},

	// Esquema para cambio de contraseña
	changePassword: {
		body: {
			type: "object",
			required: ["currentPassword", "newPassword"],
			properties: {
				currentPassword: {
					type: "string",
				},
				newPassword: {
					type: "string",
					minLength: 6,
				},
			},
		},
	},

	// Esquema para actualización de perfil
	updateProfile: {
		body: {
			type: "object",
			properties: {
				firstName: {
					type: "string",
					minLength: 1,
				},
				lastName: {
					type: "string",
					minLength: 1,
				},
				avatar: {
					type: "string",
				},
			},
		},
	},
};
