import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { resolveCorsOrigin } from './cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigin = resolveCorsOrigin();
  if (process.env.NODE_ENV === 'production' && Array.isArray(corsOrigin) && corsOrigin.length === 0) {
    console.warn(
      'CORS_ORIGINS is not set — browser requests from the Vet CRM web app will be blocked. ' +
        'Set CORS_ORIGINS to your Netlify URL(s), comma-separated.',
    );
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);
}
bootstrap();
