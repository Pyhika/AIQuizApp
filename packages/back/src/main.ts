import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { webcrypto } from 'crypto';

if (!global.crypto) {
  global.crypto = webcrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads', 'profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS を有効にする
  app.enableCors({
    origin: true, // 開発環境では全てのオリジンを許可
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend server is running on http://localhost:${port}`);
}
bootstrap();
