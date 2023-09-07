import "dotenv/config";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import * as middlewares from "./lib/middlewares";
import { generateRoutes } from "./lib/utils";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(cors());
app.use("/", generateRoutes("./rest"));

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
