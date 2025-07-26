import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config/docs/swagger.config';
import { ValidateInputPipe } from './config/pipe/validate.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration for testing
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or file:// protocol)
      if (!origin) return callback(null, true);

      // Allow specific origins
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow for development/testing (you can remove this in production)
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Swagger configuration
  SwaggerConfig.config(app);

  // DTO validation pipe configuration
  app.useGlobalPipes(new ValidateInputPipe());

  await app.listen(process.env.PORT || 3001);
}

bootstrap();
