import { StorageService } from "../services/storageService.js";
import { FileAnalysisService } from "../services/fileAnalysisService.js";
import { File } from "../models/File.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import fs from "fs";
import path from "path";
import os from "os";

export class FileController {
	constructor() {
		this.storageService = new StorageService();
		this.fileAnalysisService = new FileAnalysisService();
	}

	// Subir archivo 3D
	async uploadFile(request, reply) {
		try {
			const data = await request.file();

			if (!data) {
				return errorResponse("No se proporcionó ningún archivo");
			}

			// Verificar tipo de archivo
			const allowedTypes = [
				"model/stl",
				"model/obj",
				"application/octet-stream",
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
			];
			const allowedExtensions = [
				".stl",
				".obj",
				".jpg",
				".jpeg",
				".png",
				".gif",
				".webp",
			];

			const fileExtension = data.filename
				? path.extname(data.filename).toLowerCase()
				: "";
			const isValidType =
				allowedTypes.includes(data.mimetype) ||
				allowedExtensions.includes(fileExtension);

			if (!isValidType) {
				return errorResponse("Solo se permiten archivos STL, OBJ e imágenes");
			}

			const userId = request.user?.userId;

			if (!userId) {
				console.error("userId no encontrado en request.user:", request.user);
				console.error(
					"Headers de autorización:",
					request.headers.authorization,
				);
				console.error(
					"Token completo:",
					request.headers.authorization?.split(" ")[1],
				);
				return errorResponse(
					"Usuario no autenticado. Verifica que hayas iniciado sesión y que tu token sea válido.",
				);
			}

			console.log("Subiendo archivo para userId:", userId);

			// Leer el buffer del archivo desde el stream
			const chunks = [];
			for await (const chunk of data.file) {
				chunks.push(chunk);
			}
			const buffer = Buffer.concat(chunks);

			// Crear objeto de archivo compatible
			const file = {
				buffer: buffer,
				filename: data.filename, // Cambiado de originalname a filename
				originalname: data.filename,
				mimetype: data.mimetype,
				size: buffer.length,
			};

			// Subir archivo a MinIO
			const uploadResult = await this.storageService.uploadFile(file, userId);

			if (!uploadResult.success) {
				return errorResponse(uploadResult.message);
			}

			// Determinar el tipo de archivo
			let fileType = "quotation"; // Por defecto para archivos 3D
			if (data.mimetype.startsWith("image/")) {
				// Verificar si es un avatar (por el nombre del archivo o contexto)
				const isAvatar =
					data.filename.toLowerCase().includes("avatar") ||
					data.filename.toLowerCase().includes("profile") ||
					data.filename.toLowerCase().includes("photo");

				fileType = isAvatar ? "avatar" : "image";
			}

			// Guardar información en base de datos
			const fileData = {
				userId: userId,
				originalName: file.originalname,
				filename: uploadResult.data.filename,
				filePath: uploadResult.data.key,
				fileSize: file.size,
				mimeType: file.mimetype,
				type: fileType,
				isValid: fileType === "image" ? true : false, // Las imágenes son válidas por defecto
			};

			const savedFile = await File.create(fileData);
			console.log("Archivo guardado en BD:", savedFile);

			return successResponse("Archivo subido exitosamente", {
				file: {
					id: savedFile._id,
					originalName: savedFile.originalName,
					filename: savedFile.filename,
					fileSize: savedFile.fileSize,
					type: savedFile.type,
					isValid: savedFile.isValid,
				},
			});
		} catch (error) {
			console.error("Error en uploadFile:", error);
			return errorResponse("Error subiendo archivo", { error: error.message });
		}
	}

	// Subir imagen específicamente
	async uploadImage(request, reply) {
		try {
			const data = await request.file();

			if (!data) {
				return errorResponse("No se proporcionó ninguna imagen");
			}

			// Verificar que sea una imagen
			const allowedImageTypes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
			];
			const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

			const fileExtension = data.filename
				? path.extname(data.filename).toLowerCase()
				: "";
			const isValidImage =
				allowedImageTypes.includes(data.mimetype) ||
				allowedImageExtensions.includes(fileExtension);

			if (!isValidImage) {
				return errorResponse(
					"Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)",
				);
			}

			const userId = request.user?.userId;

			if (!userId) {
				return errorResponse("Usuario no autenticado");
			}

			console.log("Subiendo imagen para userId:", userId);

			// Leer el buffer del archivo desde el stream
			const chunks = [];
			for await (const chunk of data.file) {
				chunks.push(chunk);
			}
			const buffer = Buffer.concat(chunks);

			// Crear objeto de archivo compatible
			const file = {
				buffer: buffer,
				filename: data.filename,
				originalname: data.filename,
				mimetype: data.mimetype,
				size: buffer.length,
			};

			// Subir archivo a MinIO
			const uploadResult = await this.storageService.uploadFile(file, userId);

			if (!uploadResult.success) {
				return errorResponse(uploadResult.message);
			}

			// Guardar información en base de datos como imagen
			const fileData = {
				userId: userId,
				originalName: file.originalname,
				filename: uploadResult.data.filename,
				filePath: uploadResult.data.key,
				fileSize: file.size,
				mimeType: file.mimetype,
				type: "image",
				isValid: true, // Las imágenes son válidas por defecto
			};

			const savedFile = await File.create(fileData);
			console.log("Imagen guardada en BD:", savedFile);

			return successResponse("Imagen subida exitosamente", {
				file: {
					id: savedFile._id,
					originalName: savedFile.originalName,
					filename: savedFile.filename,
					fileSize: savedFile.fileSize,
					type: savedFile.type,
					isValid: savedFile.isValid,
				},
			});
		} catch (error) {
			console.error("Error en uploadImage:", error);
			return errorResponse("Error subiendo imagen", { error: error.message });
		}
	}

	// Obtener archivos del usuario
	async getUserFiles(request, reply) {
		try {
			const userId = request.user.userId;
			const { type } = request.query; // Permitir filtrar por tipo

			// Construir filtro
			const filter = { userId };
			if (type && ["quotation", "order", "image", "avatar"].includes(type)) {
				filter.type = type;
			}

			const files = await File.find(filter).sort({ createdAt: -1 });

			return successResponse("Archivos obtenidos exitosamente", { files });
		} catch (error) {
			console.error("Error obteniendo archivos:", error);
			return errorResponse("Error obteniendo archivos", {
				error: error.message,
			});
		}
	}

	// Obtener archivo específico
	async getFile(request, reply) {
		try {
			const { fileId } = request.params;
			const userId = request.user.userId;

			const file = await File.findOne({ _id: fileId, userId });

			if (!file) {
				return errorResponse("Archivo no encontrado");
			}

			// Generar URL temporal para descarga
			const urlResult = await this.storageService.getSignedUrl(file.filePath);

			if (!urlResult.success) {
				return errorResponse("Error generando URL de descarga");
			}

			return successResponse("Archivo obtenido exitosamente", {
				file: {
					...file.toObject(),
					downloadUrl: urlResult.data.url,
				},
			});
		} catch (error) {
			console.error("Error obteniendo archivo:", error);
			return errorResponse("Error obteniendo archivo", {
				error: error.message,
			});
		}
	}

	// Eliminar archivo
	async deleteFile(request, reply) {
		try {
			const { fileId } = request.params;
			const userId = request.user.userId;

			const file = await File.findOne({ _id: fileId, userId });

			if (!file) {
				return errorResponse("Archivo no encontrado");
			}

			// Eliminar de MinIO
			const deleteResult = await this.storageService.deleteFile(file.filePath);

			if (!deleteResult.success) {
				console.error(
					"Error eliminando archivo de MinIO:",
					deleteResult.message,
				);
			}

			// Eliminar de base de datos
			await File.findByIdAndDelete(fileId);

			return successResponse("Archivo eliminado exitosamente");
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			return errorResponse("Error eliminando archivo", {
				error: error.message,
			});
		}
	}

	// Validar archivo con análisis real
	async validateFile(request, reply) {
		try {
			const { fileId } = request.params;
			const userId = request.user.userId;

			console.log("Validando archivo - fileId:", fileId);
			console.log("Validando archivo - userId:", userId);

			const file = await File.findOne({ _id: fileId, userId });
			console.log("Archivo encontrado:", file);

			if (!file) {
				console.log("Archivo no encontrado en BD");
				return errorResponse("Archivo no encontrado");
			}

			// Crear archivo temporal para análisis
			const tempDir = os.tmpdir();
			const tempFilePath = path.join(tempDir, file.originalName);

			console.log("Descargando archivo de MinIO a:", tempFilePath);

			// Descargar archivo de MinIO
			const downloadResult = await this.storageService.downloadFile(
				file.filePath,
				tempFilePath,
			);
			if (!downloadResult.success) {
				return errorResponse("Error descargando archivo para análisis");
			}

			// Verificar que el archivo existe
			if (!fs.existsSync(tempFilePath)) {
				return errorResponse(
					"Error: Archivo temporal no se creó correctamente",
				);
			}

			console.log("Archivo descargado exitosamente, analizando...");

			// Determinar tipo de archivo
			const fileExtension = path.extname(file.originalName).toLowerCase();
			const fileType = fileExtension === ".stl" ? "stl" : "obj";

			// Analizar archivo
			console.log("🔍 Iniciando análisis del archivo...");
			console.log("📁 Ruta del archivo:", tempFilePath);
			console.log("📄 Tipo de archivo:", fileType);

			const analysisResult = await this.fileAnalysisService.analyzeFile(
				tempFilePath,
				fileType,
			);

			console.log("📊 Resultado del análisis:", analysisResult);

			if (!analysisResult.success) {
				console.log("❌ Análisis falló:", analysisResult.message);
				return errorResponse(analysisResult.message);
			}

			const { volume, dimensions, isValid, validationErrors } =
				analysisResult.data;

			// Actualizar archivo con resultados de validación real
			await File.findByIdAndUpdate(fileId, {
				isValid,
				validationErrors,
				volume,
				dimensions,
			});

			// Limpiar archivo temporal
			if (fs.existsSync(tempFilePath)) {
				fs.unlinkSync(tempFilePath);
			}

			return successResponse("Archivo validado exitosamente", {
				isValid,
				validationErrors,
				volume,
				dimensions,
			});
		} catch (error) {
			console.error("Error validando archivo:", error);
			return errorResponse("Error validando archivo", { error: error.message });
		}
	}
}
