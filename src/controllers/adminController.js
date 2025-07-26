import { CleanupService } from "../services/cleanupService.js";
import { File } from "../models/File.js";
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

			return successResponse("Estadísticas obtenidas exitosamente", stats);
		} catch (error) {
			console.error("Error obteniendo estadísticas:", error);
			return errorResponse("Error obteniendo estadísticas", {
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

	// Listar archivos por estado
	async listFilesByStatus(request, reply) {
		try {
			const { status = "quotation", page = 1, limit = 20 } = request.query;
			const skip = (page - 1) * limit;

			const files = await File.find({ status })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.populate("userId", "email");

			const total = await File.countDocuments({ status });

			return successResponse(`Archivos ${status} obtenidos`, {
				files,
				status,
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
}
