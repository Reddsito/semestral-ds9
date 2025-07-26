import { Quote } from "../models/Quote.js";
import { File } from "../models/File.js";
import { Material } from "../models/Material.js";
import { Finish } from "../models/Finish.js";
import { UserModel as User } from "../models/User.js";

export class QuoteManagementService {
	// Crear una nueva cotización
	async createQuote(quoteData) {
		try {
			// Asegurar que expiresAt se establezca si no está presente
			if (!quoteData.expiresAt) {
				quoteData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
			}

			console.log("📊 Datos de cotización procesados:", quoteData);

			const quote = new Quote(quoteData);
			await quote.save();
			return { success: true, data: quote };
		} catch (error) {
			console.error("Error creando cotización:", error);
			return { success: false, message: "Error creando cotización" };
		}
	}

	// Obtener cotizaciones de un usuario
	async getUserQuotes(userId, page = 1, limit = 10) {
		try {
			console.log("🔍 QuoteManagementService.getUserQuotes llamado con:", {
				userId,
				page,
				limit,
			});

			const skip = (page - 1) * limit;

			const quotes = await Quote.find({
				userId,
				status: { $ne: "deleted" },
			})
				.populate("fileId", "filename volume")
				.populate("materialId", "name color")
				.populate("finishId", "name")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit);

			console.log("📊 Quotes encontradas:", quotes.length);

			const total = await Quote.countDocuments({
				userId,
				status: { $ne: "deleted" },
			});

			console.log("📈 Total de cotizaciones:", total);

			// Marcar cotizaciones expiradas
			const now = new Date();
			for (let quote of quotes) {
				if (quote.status === "active" && quote.expiresAt < now) {
					quote.status = "expired";
					await quote.save();
				}
			}

			const result = {
				success: true,
				data: {
					quotes,
					pagination: {
						page,
						limit,
						total,
						pages: Math.ceil(total / limit),
					},
				},
			};

			console.log("✅ Resultado del servicio:", result);
			return result;
		} catch (error) {
			console.error("Error obteniendo cotizaciones del usuario:", error);
			return { success: false, message: "Error obteniendo cotizaciones" };
		}
	}

	// Obtener todas las cotizaciones (para admin)
	async getAllQuotes(filters = {}, page = 1, limit = 20) {
		try {
			const skip = (page - 1) * limit;

			// Construir filtros
			const query = { status: { $ne: "deleted" } };

			if (filters.userId) {
				query.userId = filters.userId;
			}

			if (filters.status) {
				query.status = filters.status;
			}

			if (filters.dateFrom) {
				query.createdAt = { $gte: new Date(filters.dateFrom) };
			}

			if (filters.dateTo) {
				if (query.createdAt) {
					query.createdAt.$lte = new Date(filters.dateTo);
				} else {
					query.createdAt = { $lte: new Date(filters.dateTo) };
				}
			}

			const quotes = await Quote.find(query)
				.populate("userId", "firstName lastName email")
				.populate("fileId", "filename volume")
				.populate("materialId", "name color")
				.populate("finishId", "name")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit);

			const total = await Quote.countDocuments(query);

			// Marcar cotizaciones expiradas
			const now = new Date();
			for (let quote of quotes) {
				if (quote.status === "active" && quote.expiresAt < now) {
					quote.status = "expired";
					await quote.save();
				}
			}

			return {
				success: true,
				data: {
					quotes,
					pagination: {
						page,
						limit,
						total,
						pages: Math.ceil(total / limit),
					},
				},
			};
		} catch (error) {
			console.error("Error obteniendo todas las cotizaciones:", error);
			return { success: false, message: "Error obteniendo cotizaciones" };
		}
	}

	// Obtener una cotización específica
	async getQuoteById(quoteId, userId = null) {
		try {
			const query = { _id: quoteId, status: { $ne: "deleted" } };

			// Si se proporciona userId, verificar que pertenece al usuario
			if (userId) {
				query.userId = userId;
			}

			const quote = await Quote.findOne(query)
				.populate("userId", "firstName lastName email")
				.populate("fileId", "filename volume dimensions")
				.populate("materialId", "name color pricePerGram")
				.populate("finishId", "name priceMultiplier");

			if (!quote) {
				return { success: false, message: "Cotización no encontrada" };
			}

			// Verificar si está expirada
			if (quote.status === "active" && quote.isExpired()) {
				quote.status = "expired";
				await quote.save();
			}

			return { success: true, data: quote };
		} catch (error) {
			console.error("Error obteniendo cotización:", error);
			return { success: false, message: "Error obteniendo cotización" };
		}
	}

	// Eliminar cotización (marcar como eliminada)
	async deleteQuote(quoteId, userId) {
		try {
			const quote = await Quote.findOne({
				_id: quoteId,
				userId,
				status: { $ne: "deleted" },
			});

			if (!quote) {
				return { success: false, message: "Cotización no encontrada" };
			}

			quote.status = "deleted";
			await quote.save();

			return { success: true, message: "Cotización eliminada exitosamente" };
		} catch (error) {
			console.error("Error eliminando cotización:", error);
			return { success: false, message: "Error eliminando cotización" };
		}
	}

	// Limpiar cotizaciones expiradas (tarea programada)
	async cleanupExpiredQuotes() {
		try {
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

			console.log(
				`📅 Limpieza de cotizaciones: ${result.modifiedCount} cotizaciones marcadas como expiradas`,
			);
			return { success: true, modifiedCount: result.modifiedCount };
		} catch (error) {
			console.error("Error limpiando cotizaciones expiradas:", error);
			return { success: false, message: "Error limpiando cotizaciones" };
		}
	}

	// Obtener estadísticas de cotizaciones
	async getQuoteStats() {
		try {
			const stats = await Quote.aggregate([
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
						totalValue: { $sum: "$totalPrice" },
					},
				},
			]);

			const totalQuotes = await Quote.countDocuments({
				status: { $ne: "deleted" },
			});
			const activeQuotes = await Quote.countDocuments({ status: "active" });
			const expiredQuotes = await Quote.countDocuments({ status: "expired" });

			return {
				success: true,
				data: {
					stats,
					totalQuotes,
					activeQuotes,
					expiredQuotes,
				},
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas:", error);
			return { success: false, message: "Error obteniendo estadísticas" };
		}
	}
}
