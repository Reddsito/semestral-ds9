import Fastify from "fastify";

const app = Fastify();

const port = 3000;

app.get("/", async () => {
	return { hello: "world" };
});

app.listen({ port }, () => {
	console.log(`API running on http://localhost:${port}`);
});
