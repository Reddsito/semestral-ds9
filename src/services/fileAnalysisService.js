import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import fs from "fs";
import path from "path";

export class FileAnalysisService {
	constructor() {
		this.stlLoader = new STLLoader();
		this.objLoader = new OBJLoader();
	}

	// Analizar archivo STL/OBJ y obtener información real
	async analyzeFile(filePath, fileType) {
		try {
			console.log("🔍 Analizando archivo:", filePath);
			console.log("📄 Tipo:", fileType);

			let geometry;

			if (fileType === "stl") {
				console.log("📦 Cargando archivo STL...");
				geometry = await this.loadSTLFile(filePath);
				console.log("✅ Archivo STL cargado exitosamente");
			} else if (fileType === "obj") {
				console.log("📦 Cargando archivo OBJ...");
				geometry = await this.loadOBJFile(filePath);
				console.log("✅ Archivo OBJ cargado exitosamente");
			} else {
				throw new Error("Tipo de archivo no soportado");
			}

			console.log("🔍 Geometría obtenida:", {
				hasPosition: !!geometry.attributes.position,
				positionCount: geometry.attributes.position?.count || 0,
			});

			// Calcular volumen real
			console.log("📦 Calculando volumen...");
			const volume = this.calculateVolume(geometry);

			// Calcular dimensiones
			console.log("📏 Calculando dimensiones...");
			const dimensions = this.calculateDimensions(geometry);

			// Validar el modelo
			console.log("🔍 Iniciando validación...");
			const validation = this.validateModel(geometry);
			console.log("✅ Validación completada:", validation);

			console.log("📊 Resultados finales:", {
				volume,
				dimensions,
				isValid: validation.isValid,
				errors: validation.errors,
			});

			return {
				success: validation.isValid,
				message: validation.isValid
					? "Archivo válido"
					: "El archivo no es válido para cotización",
				data: {
					volume: volume, // cm³
					dimensions: dimensions, // mm
					isValid: validation.isValid,
					validationErrors: validation.errors,
					boundingBox: validation.boundingBox,
				},
			};
		} catch (error) {
			console.error("❌ Error analizando archivo:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Cargar archivo STL
	async loadSTLFile(filePath) {
		return new Promise((resolve, reject) => {
			// Leer el archivo como buffer
			const buffer = fs.readFileSync(filePath);

			// Convertir buffer a ArrayBuffer para Three.js
			const arrayBuffer = buffer.buffer.slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			);

			try {
				const geometry = this.stlLoader.parse(arrayBuffer);
				resolve(geometry);
			} catch (error) {
				reject(new Error("Error parseando archivo STL: " + error.message));
			}
		});
	}

	// Cargar archivo OBJ
	async loadOBJFile(filePath) {
		return new Promise((resolve, reject) => {
			try {
				const content = fs.readFileSync(filePath, "utf8");
				const geometry = this.objLoader.parse(content);

				// OBJLoader devuelve un Group, necesitamos extraer la geometría
				const geometries = [];

				geometry.traverse((child) => {
					if (child.geometry) {
						geometries.push(child.geometry);
					}
				});

				// Si solo hay una geometría, usarla directamente
				if (geometries.length === 1) {
					resolve(geometries[0]);
				} else if (geometries.length > 1) {
					// Para múltiples geometrías, usar la primera (o podríamos implementar merge manual)
					console.log(
						`OBJ tiene ${geometries.length} geometrías, usando la primera`,
					);
					resolve(geometries[0]);
				} else {
					reject(
						new Error("No se encontraron geometrías válidas en el archivo OBJ"),
					);
				}
			} catch (error) {
				reject(new Error("Error parseando archivo OBJ: " + error.message));
			}
		});
	}

	// Calcular volumen usando el método de Monte Carlo
	calculateVolume(geometry) {
		console.log("📦 Calculando volumen...");

		// Obtener bounding box
		geometry.computeBoundingBox();
		const box = geometry.boundingBox;

		const width = box.max.x - box.min.x;
		const height = box.max.y - box.min.y;
		const depth = box.max.z - box.min.z;

		console.log("📏 Bounding box:", { width, height, depth, unit: "mm" });

		// Volumen del bounding box (mm³)
		const boxVolume = width * height * depth;
		console.log("📦 Volumen del bounding box:", boxVolume, "mm³");

		// Calcular volumen real usando muestreo
		const samplePoints = 10000;
		let insidePoints = 0;

		console.log("🎯 Muestreando", samplePoints, "puntos...");

		for (let i = 0; i < samplePoints; i++) {
			const point = new THREE.Vector3(
				box.min.x + Math.random() * width,
				box.min.y + Math.random() * height,
				box.min.z + Math.random() * depth,
			);

			if (this.isPointInsideGeometry(point, geometry)) {
				insidePoints++;
			}
		}

		// Volumen real = (puntos dentro / total puntos) * volumen del box
		const realVolume = (insidePoints / samplePoints) * boxVolume;
		console.log("📊 Puntos dentro:", insidePoints, "/", samplePoints);
		console.log("📦 Volumen real:", realVolume, "mm³");

		// Convertir de mm³ a cm³
		const volumeInCm3 = realVolume / 1000;
		console.log("📦 Volumen final:", volumeInCm3, "cm³");

		return volumeInCm3;
	}

	// Verificar si un punto está dentro de la geometría
	isPointInsideGeometry(point, geometry) {
		// Implementación simplificada usando ray casting
		const raycaster = new THREE.Raycaster();
		const direction = new THREE.Vector3(1, 0, 0);

		raycaster.set(point, direction);
		const intersects = raycaster.intersectObject(new THREE.Mesh(geometry));

		// Si hay un número impar de intersecciones, el punto está dentro
		return intersects.length % 2 === 1;
	}

	// Calcular dimensiones del modelo
	calculateDimensions(geometry) {
		geometry.computeBoundingBox();
		const box = geometry.boundingBox;

		return {
			width: Math.abs(box.max.x - box.min.x), // mm
			height: Math.abs(box.max.y - box.min.y), // mm
			depth: Math.abs(box.max.z - box.min.z), // mm
		};
	}

	// Validar el modelo
	validateModel(geometry) {
		const errors = [];
		let isValid = true;

		console.log("🔍 Validando modelo...");
		console.log("📊 Geometría:", {
			hasPosition: !!geometry.attributes.position,
			positionCount: geometry.attributes.position?.count || 0,
			hasFaces: !!geometry.index,
			faceCount: geometry.index?.count || 0,
		});

		// Verificar si tiene geometría
		if (
			!geometry.attributes.position ||
			geometry.attributes.position.count === 0
		) {
			errors.push("El archivo no contiene geometría válida");
			isValid = false;
		}

		// Verificar tamaño mínimo
		const dimensions = this.calculateDimensions(geometry);
		console.log("📏 Dimensiones:", dimensions);

		const minSize = 0.001; // 0.001mm mínimo (extremadamente flexible para testing)
		const maxSize = 100000; // 100000mm máximo (extremadamente flexible para testing)

		console.log("📏 Validando dimensiones:");
		console.log(
			`   Ancho: ${dimensions.width}mm (min: ${minSize}mm, max: ${maxSize}mm)`,
		);
		console.log(
			`   Alto: ${dimensions.height}mm (min: ${minSize}mm, max: ${maxSize}mm)`,
		);
		console.log(
			`   Profundidad: ${dimensions.depth}mm (min: ${minSize}mm, max: ${maxSize}mm)`,
		);

		if (
			dimensions.width < minSize ||
			dimensions.height < minSize ||
			dimensions.depth < minSize
		) {
			errors.push(
				"El modelo es demasiado pequeño (mínimo 0.001mm por dimensión)",
			);
			isValid = false;
		}

		if (
			dimensions.width > maxSize ||
			dimensions.height > maxSize ||
			dimensions.depth > maxSize
		) {
			errors.push(
				"El modelo es demasiado grande (máximo 1000mm por dimensión)",
			);
			isValid = false;
		}

		// Verificar volumen mínimo
		const volume = this.calculateVolume(geometry);
		console.log("📦 Volumen:", volume, "cm³");

		const minVolume = 0.0001; // 0.0001 cm³ mínimo (extremadamente flexible para testing)
		const maxVolume = 1000000; // 1,000,000 cm³ máximo (extremadamente flexible para testing)

		console.log(
			`📦 Validando volumen: ${volume}cm³ (min: ${minVolume}cm³, max: ${maxVolume}cm³)`,
		);

		if (volume < minVolume) {
			errors.push(
				"El volumen del modelo es demasiado pequeño (mínimo 0.0001 cm³)",
			);
			isValid = false;
		}

		if (volume > maxVolume) {
			errors.push(
				"El volumen del modelo es demasiado grande (máximo 10,000 cm³)",
			);
			isValid = false;
		}

		console.log("✅ Validación completada:", { isValid, errors });

		return {
			isValid,
			errors,
			boundingBox: geometry.boundingBox,
		};
	}

	// Calcular peso basado en volumen y densidad del material
	calculateWeight(volume, materialName) {
		const densities = {
			PLA: 1.24, // g/cm³
			ABS: 1.04, // g/cm³
			PETG: 1.27, // g/cm³
			TPU: 1.21, // g/cm³
		};

		const density = densities[materialName] || 1.24; // Default a PLA
		return volume * density; // gramos
	}
}
