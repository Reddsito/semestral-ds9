import { QuoteService } from "../services/quoteService.js";
import { File } from "../models/File.js";
import { Material } from "../models/Material.js";
import { Finish } from "../models/Finish.js";
import { Order } from "../models/Order.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

export class QuoteController {
	constructor() {
		this.quoteService = new QuoteService();
	}

	// Calcular cotización
	async calculateQuote(request, reply) {
		try {
			const { fileId, materialId, finishId, quantity = 1 } = request.body;

			// Validar datos requeridos
			if (!fileId || !materialId || !finishId) {
				return errorResponse("Datos incompletos para cotización", {
					required: ["fileId", "materialId", "finishId"],
				});
			}

			// Obtener archivo
			const file = await File.findById(fileId);
			if (!file) {
				return errorResponse("Archivo no encontrado");
			}

			// Verificar que el archivo pertenece al usuario
			if (file.userId.toString() !== request.user.userId) {
				return errorResponse("No tienes permisos para acceder a este archivo");
			}

			// Verificar que el archivo es válido
			if (!file.isValid) {
				return errorResponse("El archivo no es válido para cotización");
			}

			// Log para debug
			console.log("📊 Datos de cotización recibidos:");
			console.log(`   FileId: ${fileId}`);
			console.log(`   MaterialId: ${materialId}`);
			console.log(`   FinishId: ${finishId}`);
			console.log(`   Quantity: ${quantity} (tipo: ${typeof quantity})`);
			console.log(`   Volume: ${file.volume}cm³`);

			// Calcular cotización
			const quoteResult = await this.quoteService.calculateQuote(
				{
					volume: file.volume,
					dimensions: file.dimensions,
				},
				materialId,
				finishId,
				quantity,
			);

			if (!quoteResult.success) {
				return errorResponse(quoteResult.message);
			}

			return successResponse(
				"Cotización calculada exitosamente",
				quoteResult.data,
			);
		} catch (error) {
			console.error("Error en calculateQuote:", error);
			return errorResponse("Error calculando cotización", {
				error: error.message,
			});
		}
	}

	// Obtener materiales disponibles
	async getMaterials(request, reply) {
		try {
			const materials = await Material.find({ isActive: true }).select(
				"name description pricePerGram color",
			);

			return successResponse("Materiales obtenidos exitosamente", {
				materials,
			});
		} catch (error) {
			console.error("Error obteniendo materiales:", error);
			return errorResponse("Error obteniendo materiales", {
				error: error.message,
			});
		}
	}

	// Obtener acabados disponibles
	async getFinishes(request, reply) {
		try {
			const finishes = await Finish.find({ isActive: true }).select(
				"name description priceMultiplier",
			);

			return successResponse("Acabados obtenidos exitosamente", { finishes });
		} catch (error) {
			console.error("Error obteniendo acabados:", error);
			return errorResponse("Error obteniendo acabados", {
				error: error.message,
			});
		}
	}

	// Obtener desglose de precios de un pedido
	async getPriceBreakdown(request, reply) {
		try {
			const { orderId } = request.params;

			// Verificar que el pedido pertenece al usuario (si no es admin)
			if (request.user.role !== "admin") {
				const order = await Order.findOne({
					_id: orderId,
					userId: request.user.userId,
				});
				if (!order) {
					return errorResponse("Pedido no encontrado o sin permisos");
				}
			}

			const breakdownResult = await this.quoteService.getPriceBreakdown(
				orderId,
			);

			if (!breakdownResult.success) {
				return errorResponse(breakdownResult.message);
			}

			return successResponse(
				"Desglose obtenido exitosamente",
				breakdownResult.data,
			);
		} catch (error) {
			console.error("Error obteniendo desglose:", error);
			return errorResponse("Error obteniendo desglose", {
				error: error.message,
			});
		}
	}

	// Guardar cotización
	async saveQuote(request, reply) {
		try {
			const {
				fileId,
				materialId,
				finishId,
				quantity = 1,
				notes,
			} = request.body;
			const userId = request.user.userId;

			// Validar datos requeridos
			if (!fileId || !materialId || !finishId) {
				return errorResponse("Datos incompletos para cotización", {
					required: ["fileId", "materialId", "finishId"],
				});
			}

			// Obtener archivo
			const file = await File.findById(fileId);
			if (!file) {
				return errorResponse("Archivo no encontrado");
			}

			// Verificar que el archivo pertenece al usuario
			if (file.userId.toString() !== userId) {
				return errorResponse("No tienes permisos para acceder a este archivo");
			}

			// Calcular cotización
			const quoteResult = await this.quoteService.calculateQuote(
				{
					volume: file.volume,
					dimensions: file.dimensions,
				},
				materialId,
				finishId,
				quantity,
			);

			if (!quoteResult.success) {
				return errorResponse(quoteResult.message);
			}

			// Importar el servicio de gestión de cotizaciones
			const { QuoteManagementService } = await import(
				"../services/quoteManagementService.js"
			);
			const quoteManagementService = new QuoteManagementService();

			// Crear datos de la cotización
			const quoteData = {
				userId,
				fileId,
				materialId,
				finishId,
				quantity,
				totalPrice: quoteResult.data.totalPrice,
				priceBreakdown: quoteResult.data.breakdown,
				notes,
			};

			// Guardar cotización
			const saveResult = await quoteManagementService.createQuote(quoteData);

			if (!saveResult.success) {
				return errorResponse(saveResult.message);
			}

			return successResponse("Cotización guardada exitosamente", {
				quote: saveResult.data,
			});
		} catch (error) {
			console.error("Error guardando cotización:", error);
			return errorResponse("Error guardando cotización", {
				error: error.message,
			});
		}
	}
}
