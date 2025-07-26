import { File } from "../models/File.js";
import { Quote } from "../models/Quote.js";
import { StorageService } from "./storageService.js";

export class CleanupService {
	constructor() {
		this.storageService = new StorageService();
		// Para testing: cada 1 hora, para producción: 24 horas
		this.cleanupInterval =
			process.env.NODE_ENV === "production"
				? 24 * 60 * 60 * 1000 // 24 horas
				: 60 * 60 * 1000; // 1 hora
		this.tempFileExpiry = 7 * 24 * 60 * 60 * 1000; // 7 días
	}

	// Iniciar limpieza automática
	startAutoCleanup() {
		console.log("🧹 Iniciando limpieza automática...");
		setInterval(() => {
			this.cleanupTempFiles();
			this.cleanupExpiredQuotes();
		}, this.cleanupInterval);
	}

	// Limpiar archivos de cotización (solo cotización, no ordenados)
	async cleanupQuotationFiles() {
		try {
			console.log("🧹 Limpiando archivos de cotización...");

			const cutoffDate = new Date(Date.now() - this.tempFileExpiry);

			// Encontrar archivos de cotización antiguos (más de 7 días)
			const quotationFiles = await File.find({
				status: "quotation",
				quotedAt: { $lt: cutoffDate },
			});

			console.log(
				`📁 Encontrados ${quotationFiles.length} archivos de cotización para limpiar`,
			);

			for (const file of quotationFiles) {
				try {
					// Eliminar de MinIO
					await this.storageService.deleteFile(file.filePath);

					// Eliminar de MongoDB
					await File.findByIdAndDelete(file._id);

					console.log(
						`✅ Limpiado archivo de cotización: ${file.originalName}`,
					);
				} catch (error) {
					console.error(
						`❌ Error limpiando archivo ${file.originalName}:`,
						error,
					);
				}
			}

			console.log("✅ Limpieza de cotizaciones completada");
		} catch (error) {
			console.error("❌ Error en limpieza automática:", error);
		}
	}

	// Limpiar archivos temporales (método anterior para compatibilidad)
	async cleanupTempFiles() {
		await this.cleanupQuotationFiles();
	}

	// Limpiar cotizaciones expiradas
	async cleanupExpiredQuotes() {
		try {
			console.log("📅 Limpiando cotizaciones expiradas...");

			const now = new Date();
			const result = await Quote.updateMany(
				{
					status: "active",
					expiresAt: { $lt: now },
				},
				{
					status: "expired",
				},
			);

			if (result.modifiedCount > 0) {
				console.log(
					`✅ ${result.modifiedCount} cotizaciones marcadas como expiradas`,
				);
			} else {
				console.log("📅 No hay cotizaciones expiradas para limpiar");
			}
		} catch (error) {
			console.error("❌ Error limpiando cotizaciones expiradas:", error);
		}
	}

	// Limpiar archivos de un usuario específico
	async cleanupUserFiles(userId) {
		try {
			const userFiles = await File.find({
				userId,
				$or: [{ orderId: { $exists: false } }, { orderId: null }],
			});

			for (const file of userFiles) {
				await this.storageService.deleteFile(file.filePath);
				await File.findByIdAndDelete(file._id);
			}

			return {
				success: true,
				message: `Limpiados ${userFiles.length} archivos del usuario`,
				count: userFiles.length,
			};
		} catch (error) {
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Obtener estadísticas de archivos
	async getFileStats() {
		try {
			const totalFiles = await File.countDocuments();
			const quotationFiles = await File.countDocuments({ status: "quotation" });
			const orderedFiles = await File.countDocuments({ status: "ordered" });
			const completedFiles = await File.countDocuments({ status: "completed" });
			const cancelledFiles = await File.countDocuments({ status: "cancelled" });

			return {
				total: totalFiles,
				quotation: quotationFiles,
				ordered: orderedFiles,
				completed: completedFiles,
				cancelled: cancelledFiles,
				storageUsed: await this.calculateStorageUsed(),
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas:", error);
			return null;
		}
	}

	// Calcular espacio usado
	async calculateStorageUsed() {
		try {
			const files = await File.find({});
			const totalBytes = files.reduce((sum, file) => sum + file.fileSize, 0);

			return {
				bytes: totalBytes,
				mb: (totalBytes / (1024 * 1024)).toFixed(2),
				gb: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
			};
		} catch (error) {
			console.error("Error calculando espacio usado:", error);
			return null;
		}
	}
}
