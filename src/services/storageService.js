import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	CreateBucketCommand,
	HeadBucketCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import fs from "fs";

export class StorageService {
	constructor() {
		this.s3Client = new S3Client({
			endpoint: `http://${process.env.MINIO_ENDPOINT || "localhost"}:${
				process.env.MINIO_PORT || 9000
			}`,
			region: "us-east-1", // MinIO no requiere región específica
			credentials: {
				accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
				secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
			},
			forcePathStyle: true, // Requerido para MinIO
		});

		this.bucketName = process.env.MINIO_BUCKET_NAME || "3d-prints";
		this.avatarBucketName = process.env.MINIO_AVATAR_BUCKET || "user-avatars";
		this.initializeBuckets();
	}

	// Inicializar buckets si no existen
	async initializeBuckets() {
		try {
			// Inicializar bucket principal
			await this.initializeBucket(this.bucketName);
			// Inicializar bucket de avatares
			await this.initializeBucket(this.avatarBucketName);
		} catch (error) {
			console.error("❌ Error inicializando buckets:", error);
		}
	}

	// Inicializar bucket específico
	async initializeBucket(bucketName) {
		try {
			await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
			console.log(`✅ Bucket ${bucketName} ya existe`);
		} catch (error) {
			if (error.$metadata?.httpStatusCode === 404) {
				// Bucket no existe, crearlo
				await this.s3Client.send(
					new CreateBucketCommand({ Bucket: bucketName }),
				);
				console.log(`✅ Bucket ${bucketName} creado exitosamente`);
			} else {
				console.error(`❌ Error verificando bucket ${bucketName}:`, error);
			}
		}
	}

	async uploadFile(file, userId) {
		try {
			console.log("StorageService.uploadFile - userId:", userId);
			console.log("StorageService.uploadFile - file:", {
				filename: file.filename,
				mimetype: file.mimetype,
				size: file.size,
			});

			// Validar que userId existe
			if (!userId) {
				throw new Error("userId es requerido");
			}

			// Validar que el archivo existe
			if (!file || !file.filename) {
				throw new Error("Archivo no válido");
			}

			const timestamp = Date.now();
			const fileExtension = path.extname(file.filename);
			const fileName = `${userId}/${timestamp}-${file.filename}`;

			// Leer el buffer del archivo
			const buffer = await file.toBuffer();

			const uploadCommand = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: fileName,
				Body: buffer,
				ContentType: file.mimetype,
				Metadata: {
					originalName: file.filename,
					userId: String(userId),
					uploadDate: new Date().toISOString(),
				},
			});

			await this.s3Client.send(uploadCommand);

			return {
				success: true,
				data: {
					filename: fileName,
					originalName: file.filename,
					fileSize: file.size,
					mimeType: file.mimetype,
					url: `http://${process.env.MINIO_ENDPOINT || "localhost"}:${
						process.env.MINIO_PORT || 9000
					}/${this.bucketName}/${fileName}`,
					key: fileName,
				},
			};
		} catch (error) {
			console.error("Error subiendo archivo:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	async deleteFile(fileKey) {
		try {
			const deleteCommand = new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key: fileKey,
			});

			await this.s3Client.send(deleteCommand);

			return {
				success: true,
				message: "Archivo eliminado exitosamente",
			};
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Obtener URL temporal para descarga
	async getSignedUrl(fileKey, expiresIn = 3600) {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: fileKey,
			});

			const url = await getSignedUrl(this.s3Client, command, { expiresIn });

			return {
				success: true,
				data: { url },
			};
		} catch (error) {
			console.error("Error generando URL firmada:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Verificar si archivo existe
	async fileExists(fileKey) {
		try {
			await this.s3Client.send(
				new HeadObjectCommand({
					Bucket: this.bucketName,
					Key: fileKey,
				}),
			);
			return true;
		} catch (error) {
			return false;
		}
	}

	// Obtener información del archivo
	async getFileInfo(fileKey) {
		try {
			const result = await this.s3Client.send(
				new HeadObjectCommand({
					Bucket: this.bucketName,
					Key: fileKey,
				}),
			);

			return {
				success: true,
				data: {
					size: result.ContentLength,
					lastModified: result.LastModified,
					contentType: result.ContentType,
					metadata: result.Metadata,
				},
			};
		} catch (error) {
			console.error("Error obteniendo información del archivo:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Descargar archivo de MinIO
	async downloadFile(fileKey, localPath) {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: fileKey,
			});

			const result = await this.s3Client.send(command);
			const fileStream = result.Body;

			// Crear stream de escritura
			const writeStream = fs.createWriteStream(localPath);

			// Pipe el stream de lectura al de escritura
			await new Promise((resolve, reject) => {
				fileStream.pipe(writeStream);
				writeStream.on("finish", resolve);
				writeStream.on("error", reject);
			});

			return {
				success: true,
				message: "Archivo descargado exitosamente",
			};
		} catch (error) {
			console.error("Error descargando archivo:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	// Métodos específicos para avatares
	async uploadAvatar(file, userId) {
		try {
			console.log("StorageService.uploadAvatar - userId:", userId);
			console.log("StorageService.uploadAvatar - file:", {
				filename: file.filename,
				mimetype: file.mimetype,
				size: file.size,
			});

			// Validar que userId existe
			if (!userId) {
				throw new Error("userId es requerido");
			}

			// Validar que el archivo existe
			if (!file || !file.filename) {
				throw new Error("Archivo no válido");
			}

			// Validar tipo de archivo
			const allowedTypes = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
			];
			if (!allowedTypes.includes(file.mimetype)) {
				throw new Error("Solo se permiten imágenes (JPEG, PNG, GIF, WebP)");
			}

			// Validar tamaño (máximo 5MB)
			const maxSize = 5 * 1024 * 1024; // 5MB
			if (file.size > maxSize) {
				throw new Error("El archivo es demasiado grande. Máximo 5MB");
			}

			const timestamp = Date.now();
			const fileExtension = path.extname(file.filename);
			const avatarKey = `${userId}/avatar-${timestamp}${fileExtension}`;

			// Leer el buffer del archivo
			const buffer = await file.toBuffer();

			const uploadCommand = new PutObjectCommand({
				Bucket: this.avatarBucketName,
				Key: avatarKey,
				Body: buffer,
				ContentType: file.mimetype,
				Metadata: {
					originalName: file.filename,
					userId: String(userId),
					uploadDate: new Date().toISOString(),
					type: "avatar",
				},
			});

			await this.s3Client.send(uploadCommand);

			// Generar URL firmada
			const command = new GetObjectCommand({
				Bucket: this.avatarBucketName,
				Key: avatarKey,
			});

			const signedUrl = await getSignedUrl(this.s3Client, command, {
				expiresIn: 3600,
			});

			return {
				success: true,
				data: {
					avatarUrl: signedUrl,
					avatarKey,
					originalName: file.filename,
					fileSize: file.size,
					mimeType: file.mimetype,
				},
			};
		} catch (error) {
			console.error("Error subiendo avatar:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	async deleteAvatar(avatarKey) {
		try {
			if (!avatarKey) {
				return {
					success: false,
					message: "Clave del avatar es requerida",
				};
			}

			const deleteCommand = new DeleteObjectCommand({
				Bucket: this.avatarBucketName,
				Key: avatarKey,
			});

			await this.s3Client.send(deleteCommand);

			return {
				success: true,
				message: "Avatar eliminado exitosamente",
			};
		} catch (error) {
			console.error("Error eliminando avatar:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}

	async getAvatarUrl(avatarKey, expiresIn = 3600) {
		try {
			if (!avatarKey) {
				return {
					success: false,
					message: "Clave del avatar es requerida",
				};
			}

			const command = new GetObjectCommand({
				Bucket: this.avatarBucketName,
				Key: avatarKey,
			});

			const signedUrl = await getSignedUrl(this.s3Client, command, {
				expiresIn,
			});

			return {
				success: true,
				data: {
					signedUrl,
				},
			};
		} catch (error) {
			console.error("Error obteniendo URL del avatar:", error);
			return {
				success: false,
				message: error.message,
			};
		}
	}
}
