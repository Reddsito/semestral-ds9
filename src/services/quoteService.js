import { Material } from "../models/Material.js";
import { Finish } from "../models/Finish.js";
import { PriceBreakdown } from "../models/PriceBreakdown.js";
import { NotFoundError } from "../utils/errors.js";
import { Quote } from "../models/Quote.js";

export class QuoteService {
	constructor() {
		this.taxRate = 0.07; // 7% ITMBS en Ecuador
		this.baseShippingCost = 5.0; // Costo base de envío
		this.orderFixedCost = 10.0; // Costo fijo por pedido
	}

	async remove(quoteId) {
		const quote = await Quote.findByIdAndDelete(quoteId);
		if (!quote) {
			throw new NotFoundError("Quote not found");
		}
		return quote;
	}

	// Calcular cotización completa
	async calculateQuote(fileData, materialId, finishId, quantity = 1) {
		try {
			// Obtener material y acabado
			const material = await Material.findById(materialId);
			const finish = await Finish.findById(finishId);

			if (!material || !finish) {
				throw new Error("Material o acabado no encontrado");
			}

			// Calcular peso en gramos (asumiendo densidad de 1.24 g/cm³ para PLA)
			const weightInGrams = this.calculateWeight(
				fileData.volume,
				material.name,
			);

			// Calcular costos por unidad
			const materialCostPerUnit = this.calculateMaterialCost(
				weightInGrams,
				material.pricePerGram,
			);
			const finishCostPerUnit = this.calculateFinishCost(
				materialCostPerUnit,
				finish.priceMultiplier,
			);
			const shippingCostPerUnit = this.calculateShippingCost(weightInGrams);

			// Calcular totales por unidad
			const subtotalPerUnit =
				materialCostPerUnit + finishCostPerUnit + shippingCostPerUnit;
			const taxPerUnit = subtotalPerUnit * this.taxRate;
			const totalPerUnit = subtotalPerUnit + taxPerUnit;

			// Calcular totales con cantidad
			const materialCostTotal = materialCostPerUnit * quantity;
			const finishCostTotal = finishCostPerUnit * quantity;
			const shippingCostTotal = shippingCostPerUnit; // Envío es fijo por pedido
			const orderFixedCostTotal = this.orderFixedCost; // Costo fijo por pedido
			const subtotal =
				materialCostTotal +
				finishCostTotal +
				shippingCostTotal +
				orderFixedCostTotal;
			const tax = subtotal * this.taxRate;
			const total = subtotal + tax;

			// Logs para debug
			console.log("🔢 Cálculo de cotización:");
			console.log(`   Peso: ${weightInGrams.toFixed(2)}g`);
			console.log(`   Cantidad: ${quantity}`);
			console.log(`   Material por unidad: $${materialCostPerUnit.toFixed(2)}`);
			console.log(`   Acabado por unidad: $${finishCostPerUnit.toFixed(2)}`);
			console.log(`   Envío por unidad: $${shippingCostPerUnit.toFixed(2)}`);
			console.log(
				`   Costo fijo por pedido: $${this.orderFixedCost.toFixed(2)}`,
			);
			console.log(
				`   Material total (${quantity}x): $${materialCostTotal.toFixed(2)}`,
			);
			console.log(
				`   Acabado total (${quantity}x): $${finishCostTotal.toFixed(2)}`,
			);
			console.log(`   Envío total: $${shippingCostTotal.toFixed(2)}`);
			console.log(`   Costo fijo total: $${orderFixedCostTotal.toFixed(2)}`);
			console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
			console.log(`   ITMBS (7%): $${tax.toFixed(2)}`);
			console.log(`   Total: $${total.toFixed(2)}`);

			// Crear desglose de precios
			const priceBreakdown = {
				materialCost: {
					pricePerGram: material.pricePerGram,
					weight: weightInGrams,
					costPerUnit: materialCostPerUnit,
					quantity: quantity,
					total: materialCostTotal,
				},
				finishCost: {
					basePrice: materialCostPerUnit,
					multiplier: finish.priceMultiplier,
					costPerUnit: finishCostPerUnit,
					quantity: quantity,
					total: finishCostTotal,
				},
				fixedCosts: {
					shippingCost: shippingCostPerUnit,
					orderFixedCost: this.orderFixedCost,
					total: shippingCostTotal + orderFixedCostTotal,
					note: "Envío + Costo fijo por pedido",
				},
				subtotal: subtotal,
				tax: tax,
				total: total,
				calculationNotes: `Peso calculado: ${weightInGrams.toFixed(
					2,
				)}g (${fileData.volume.toFixed(2)}cm³) x ${quantity} unidades`,
			};

			return {
				success: true,
				data: {
					priceBreakdown,
					total: total,
					weight: weightInGrams,
					material: material.name,
					finish: finish.name,
					quantity,
				},
			};
		} catch (error) {
			console.error("Error calculando cotización:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Calcular peso basado en volumen y material
	calculateWeight(volumeInCm3, materialName) {
		const densities = {
			PLA: 1.24, // g/cm³
			ABS: 1.04, // g/cm³
			PETG: 1.27, // g/cm³
			TPU: 1.21, // g/cm³
		};

		const density = densities[materialName] || 1.24; // Default a PLA
		return volumeInCm3 * density;
	}

	// Calcular costo del material
	calculateMaterialCost(weightInGrams, pricePerGram) {
		return weightInGrams * pricePerGram;
	}

	// Calcular costo del acabado
	calculateFinishCost(materialCost, priceMultiplier) {
		return materialCost * (priceMultiplier - 1); // Solo el costo adicional
	}

	// Calcular costo de envío
	calculateShippingCost(weightInGrams) {
		// Lógica simple: costo base + adicional por peso
		if (weightInGrams <= 100) {
			return this.baseShippingCost;
		} else if (weightInGrams <= 500) {
			return this.baseShippingCost + 2;
		} else {
			return this.baseShippingCost + 5;
		}
	}

	// Guardar desglose de precios
	async savePriceBreakdown(orderId, priceBreakdown) {
		try {
			const breakdown = await PriceBreakdown.create({
				orderId,
				...priceBreakdown,
			});

			return {
				success: true,
				data: breakdown,
			};
		} catch (error) {
			console.error("Error guardando desglose de precios:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Obtener desglose de precios por ID de pedido
	async getPriceBreakdown(orderId) {
		try {
			const breakdown = await PriceBreakdown.findOne({ orderId });
			return {
				success: true,
				data: breakdown,
			};
		} catch (error) {
			console.error("Error obteniendo desglose de precios:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}
}
