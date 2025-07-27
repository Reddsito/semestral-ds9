class CheckoutStore {
	constructor() {
		this.state = {
			userId: null,
			fileId: null,
			materialId: null,
			finishId: null,
			quantity: 1,
			totalPrice: 0,
			priceBreakdown: {
				materialCost: {
					pricePerGram: 0,
					weight: 0,
					costPerUnit: 0,
					quantity: 0,
					total: 0,
				},
				finishCost: {
					basePrice: 0,
					multiplier: 0,
					costPerUnit: 0,
					quantity: 0,
					total: 0,
				},
				fixedCosts: {
					shippingCost: 0,
					orderFixedCost: 0,
					total: 0,
					note: "",
				},
				subtotal: 0,
				tax: 0,
				total: 0,
				calculationNotes: "",
			},
			status: "active",
			expiresAt: null,
			notes: "",
			quoteId: null,
		};
		this.listeners = [];
	}

	subscribe(listener) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	notify() {
		this.listeners.forEach((listener) => listener(this.state));
	}

	setState(newState) {
		console.log({ newState });
		this.state = { ...this.state, ...newState };
		console.log(this.state);
		this.notify();
	}

	getState() {
		return this.state;
	}
}

export const checkoutStore = new CheckoutStore();
