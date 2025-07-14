import { UserModel } from "../models/User.js";

export class UserService {
	static instance = null;

	constructor() {}

	static getInstance() {
		if (!UserService.instance) {
			UserService.instance = new UserService();
		}
		return UserService.instance;
	}

	async findById(id) {
		return UserModel.findById(id);
	}

	async findByEmail(email) {
		return UserModel.findOne({ email });
	}

	async findByGoogleId(googleId) {
		return UserModel.findOne({ googleId });
	}

	async findAll() {
		return UserModel.find();
	}

	async create(userData) {
		const user = new UserModel(userData);
		return user.save();
	}

	async update(id, updateData) {
		return UserModel.findByIdAndUpdate(id, updateData, { new: true });
	}

	async delete(id) {
		return UserModel.findByIdAndDelete(id);
	}

	async findByRole(role) {
		return UserModel.find({ role });
	}

	async count() {
		return UserModel.countDocuments();
	}

	async findActive() {
		return UserModel.find({ isActive: true });
	}

	async findInactive() {
		return UserModel.find({ isActive: false });
	}
}
