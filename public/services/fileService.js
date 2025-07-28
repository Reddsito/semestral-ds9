import { api } from "../lib/api.js";

class FileService {
	async getFileById(fileId) {
		try {
			const response = await api.get(`/files/${fileId}`);
			return response;
		} catch (error) {
			console.error("Error obteniendo archivo:", error);
			throw error;
		}
	}

	async uploadFile(file) {
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await api.post("/files/upload", formData);
			return response;
		} catch (error) {
			console.error("Error subiendo archivo:", error);
			throw error;
		}
	}

	async uploadImage(imageFile) {
		try {
			const formData = new FormData();
			formData.append("file", imageFile);

			const response = await api.post("/files/upload-image", formData);
			return response;
		} catch (error) {
			console.error("Error subiendo imagen:", error);
			throw error;
		}
	}

	async getUserFiles(type = null) {
		try {
			let url = "/files/user";
			if (type && ["quotation", "order", "image", "avatar"].includes(type)) {
				url += `?type=${type}`;
			}
			const response = await api.get(url);
			return response;
		} catch (error) {
			console.error("Error obteniendo archivos del usuario:", error);
			throw error;
		}
	}

	async downloadFile(url) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response;
		} catch (error) {
			console.error("Error descargando archivo:", error);
			throw error;
		}
	}

	async getFileAsArrayBuffer(url) {
		const response = await this.downloadFile(url);
		return await response.arrayBuffer();
	}

	async getFileAsText(url) {
		const response = await this.downloadFile(url);
		return await response.text();
	}

	async validateFile(fileId) {
		try {
			const response = await api.post(`/files/${fileId}/validate`);
			return response.data;
		} catch (error) {
			console.error("Error validando archivo:", error);
			throw error;
		}
	}

	async deleteFile(fileId) {
		try {
			const response = await api.delete(`/files/${fileId}`);
			return response.data;
		} catch (error) {
			console.error("Error eliminando archivo:", error);
			throw error;
		}
	}
}

export const fileService = new FileService();
