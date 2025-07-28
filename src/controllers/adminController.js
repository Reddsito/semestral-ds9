import { CleanupService } from "../services/cleanupService.js";
import { File } from "../models/File.js";
import { UserModel } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Quote } from "../models/Quote.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export class AdminController {
	constructor() {
		this.cleanupService = new CleanupService();
	}

	// Obtener estadísticas de archivos
	async getFileStats(request, reply) {
		try {
			const stats = await this.cleanupService.getFileStats();

			if (!stats) {
				return errorResponse("Error obteniendo estadísticas");
			}

			// Obtener estadísticas adicionales
			const totalOrders = await Order.countDocuments();
			const totalSales = await Order.aggregate([
				{ $match: { status: "completed" } },
				{ $group: { _id: null, total: { $sum: "$totalPrice" } } },
			]);
			const activeUsers = await UserModel.countDocuments({ isActive: true });
			const totalQuotes = await Quote.countDocuments();
			const acceptedQuotes = await Quote.countDocuments({ status: "accepted" });
			const rejectedQuotes = await Quote.countDocuments({ status: "rejected" });

			const enhancedStats = {
				...stats,
				totalOrders,
				totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
				activeUsers,
				totalQuotes,
				acceptedQuotes,
				rejectedQuotes,
			};

			return successResponse(
				"Estadísticas obtenidas exitosamente",
				enhancedStats,
			);
		} catch (error) {
			console.error("Error obteniendo estadísticas:", error);
			return errorResponse("Error obteniendo estadísticas", {
				error: error.message,
			});
		}
	}

	// Obtener datos para gráficas
	async getChartData(request, reply) {
		try {
			// Datos de ventas por semana (últimas 8 semanas)
			const salesData = await Order.aggregate([
				{ $match: { status: "completed" } },
				{
					$group: {
						_id: {
							year: { $year: "$createdAt" },
							week: { $week: "$createdAt" },
						},
						sales: { $sum: "$totalPrice" },
					},
				},
				{ $sort: { "_id.year": 1, "_id.week": 1 } },
				{ $limit: 8 },
			]);

			// Datos de estado de pedidos
			const ordersData = await Order.aggregate([
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			]);

			const chartData = {
				salesData: salesData.map((item) => ({
					week: `Semana ${item._id.week}`,
					sales: item.sales,
				})),
				ordersData: ordersData.map((item) => ({
					status: item._id,
					count: item.count,
				})),
			};

			return successResponse("Datos de gráficas obtenidos", chartData);
		} catch (error) {
			console.error("Error obteniendo datos de gráficas:", error);
			return errorResponse("Error obteniendo datos de gráficas", {
				error: error.message,
			});
		}
	}

	// Limpiar archivos temporales manualmente
	async cleanupTempFiles(request, reply) {
		try {
			await this.cleanupService.cleanupTempFiles();

			return successResponse("Limpieza de archivos temporales completada");
		} catch (error) {
			console.error("Error en limpieza manual:", error);
			return errorResponse("Error en limpieza manual", {
				error: error.message,
			});
		}
	}

	// Limpiar archivos de un usuario específico
	async cleanupUserFiles(request, reply) {
		try {
			const { userId } = request.params;

			const result = await this.cleanupService.cleanupUserFiles(userId);

			if (!result.success) {
				return errorResponse(result.message);
			}

			return successResponse(result.message, { count: result.count });
		} catch (error) {
			console.error("Error limpiando archivos de usuario:", error);
			return errorResponse("Error limpiando archivos de usuario", {
				error: error.message,
			});
		}
	}

	// Listar archivos por tipo
	async listFilesByStatus(request, reply) {
		try {
			const { status: endpointType } = request.params; // Usar el parámetro de ruta
			const { page = 1, limit = 20 } = request.query;
			const skip = (page - 1) * limit;

			// Mapear el endpoint a el tipo real en la base de datos
			let actualType = endpointType;
			if (endpointType === "image") {
				actualType = "avatar"; // El endpoint "image" busca archivos tipo "avatar"
			}

			// Validar que el tipo sea válido
			const validTypes = ["quotation", "order", "image", "avatar"];
			if (!validTypes.includes(actualType)) {
				return errorResponse("Tipo de archivo no válido", {
					validTypes,
					receivedType: endpointType,
					actualType: actualType,
				});
			}

			const files = await File.find({ type: actualType })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.populate("userId", "email");

			const total = await File.countDocuments({ type: actualType });

			return successResponse(`Archivos de tipo ${actualType} obtenidos`, {
				files,
				type: actualType,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			console.error("Error listando archivos:", error);
			return errorResponse("Error listando archivos", {
				error: error.message,
			});
		}
	}

	// Listar archivos temporales (método anterior para compatibilidad)
	async listTempFiles(request, reply) {
		return this.listFilesByStatus(request, reply);
	}

	// Eliminar archivo específico
	async deleteFile(request, reply) {
		try {
			const { fileId } = request.params;

			const file = await File.findById(fileId);

			if (!file) {
				return errorResponse("Archivo no encontrado");
			}

			// Eliminar de MinIO
			const deleteResult = await this.cleanupService.storageService.deleteFile(
				file.filePath,
			);

			if (!deleteResult.success) {
				console.error("Error eliminando de MinIO:", deleteResult.message);
			}

			// Eliminar de MongoDB
			await File.findByIdAndDelete(fileId);

			return successResponse("Archivo eliminado exitosamente");
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			return errorResponse("Error eliminando archivo", {
				error: error.message,
			});
		}
	}

	// Eliminar archivos en lote
	async bulkDeleteFiles(request, reply) {
		try {
			const { fileIds } = request.body;

			if (!fileIds || !Array.isArray(fileIds)) {
				return errorResponse("Se requiere un array de IDs de archivos");
			}

			const files = await File.find({ _id: { $in: fileIds } });
			let deletedCount = 0;

			for (const file of files) {
				try {
					// Eliminar de MinIO
					const deleteResult =
						await this.cleanupService.storageService.deleteFile(file.filePath);

					if (!deleteResult.success) {
						console.error("Error eliminando de MinIO:", deleteResult.message);
					}

					// Eliminar de MongoDB
					await File.findByIdAndDelete(file._id);
					deletedCount++;
				} catch (error) {
					console.error(`Error eliminando archivo ${file._id}:`, error);
				}
			}

			return successResponse("Archivos eliminados exitosamente", {
				deletedCount,
				totalRequested: fileIds.length,
			});
		} catch (error) {
			console.error("Error eliminando archivos en lote:", error);
			return errorResponse("Error eliminando archivos", {
				error: error.message,
			});
		}
	}

	// Obtener usuarios con filtros y paginación
	async getUsers(request, reply) {
		try {
			const {
				page = 1,
				limit = 20,
				search = "",
				role = "",
				status = "",
			} = request.query;
			const skip = (page - 1) * limit;

			// Construir filtros
			const filters = {};

			if (search) {
				filters.$or = [
					{ email: { $regex: search, $options: "i" } },
					{ firstName: { $regex: search, $options: "i" } },
					{ lastName: { $regex: search, $options: "i" } },
				];
			}

			if (role) {
				filters.role = role;
			}

			if (status === "active") {
				filters.isActive = true;
			} else if (status === "inactive") {
				filters.isActive = false;
			}

			const users = await UserModel.find(filters)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.select("-password");

			const total = await UserModel.countDocuments(filters);

			return successResponse("Usuarios obtenidos exitosamente", {
				users,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			console.error("Error obteniendo usuarios:", error);
			return errorResponse("Error obteniendo usuarios", {
				error: error.message,
			});
		}
	}

	// Obtener usuario específico con estadísticas
	async getUserById(request, reply) {
		try {
			const { userId } = request.params;

			const user = await UserModel.findById(userId).select("-password");

			if (!user) {
				return errorResponse("Usuario no encontrado");
			}

			// Obtener estadísticas del usuario
			const totalOrders = await Order.countDocuments({ userId: user._id });
			const totalQuotes = await Quote.countDocuments({ userId: user._id });
			const totalSpent = await Order.aggregate([
				{ $match: { userId: user._id, status: "completed" } },
				{ $group: { _id: null, total: { $sum: "$totalPrice" } } },
			]);

			const userWithStats = {
				...user.toObject(),
				stats: {
					totalOrders,
					totalQuotes,
					totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
				},
			};

			return successResponse("Usuario obtenido exitosamente", userWithStats);
		} catch (error) {
			console.error("Error obteniendo usuario:", error);
			return errorResponse("Error obteniendo usuario", {
				error: error.message,
			});
		}
	}

	// Cambiar estado de usuario (activar/desactivar)
	async toggleUserStatus(request, reply) {
		try {
			const { userId } = request.params;
			const { isActive } = request.body;

			const user = await UserModel.findById(userId);

			if (!user) {
				return errorResponse("Usuario no encontrado");
			}

			// No permitir desactivar el propio usuario
			if (userId === request.user.userId) {
				return errorResponse("No puedes desactivar tu propia cuenta");
			}

			user.isActive = isActive;
			await user.save();

			return successResponse(
				`Usuario ${isActive ? "activado" : "desactivado"} exitosamente`,
			);
		} catch (error) {
			console.error("Error cambiando estado de usuario:", error);
			return errorResponse("Error cambiando estado de usuario", {
				error: error.message,
			});
		}
	}
}
