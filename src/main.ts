import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import "dotenv/config";

const port = process.env.PORT || 8000;
const logger = new Logger("Bootstrap");
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  logger.log(`application started at http://localhost:${port}`);
}
bootstrap();
