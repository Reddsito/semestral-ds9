import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(
	process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
	{
		apiVersion: "2024-12-18.acacia",
	},
);

export default stripe;
