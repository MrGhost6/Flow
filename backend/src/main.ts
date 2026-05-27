import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN", "http://localhost:5173"),
    credentials: true,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = configService.get<number>("PORT", 3001);
  await app.listen(port, "0.0.0.0");
  logger.log(`FLOW API running on http://0.0.0.0:${port}`);
}

bootstrap();
