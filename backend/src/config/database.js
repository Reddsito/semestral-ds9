import mongoose from "mongoose";

export const connectDatabase = async (uri) => {
	try {
		await mongoose.connect(uri);
		console.log("✅ Conectado a MongoDB exitosamente");
	} catch (error) {
		console.error("❌ Error conectando a MongoDB:", error);
		process.exit(1);
	}
};

export const disconnectDatabase = async () => {
	try {
		await mongoose.disconnect();
		console.log("✅ Desconectado de MongoDB");
	} catch (error) {
		console.error("❌ Error desconectando de MongoDB:", error);
	}
};
