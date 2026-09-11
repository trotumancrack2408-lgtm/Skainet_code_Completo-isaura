import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuración de Swagger en Español
  const config = new DocumentBuilder()
    .setTitle('Skainet REST API - Servidor Principal')
    .setDescription('Documentación interactiva de la API REST para el control de taller, pedidos de clientes, órdenes, pesajes y usuarios.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n======================================================`);
  console.log(`🚀 Skainet REST API activa en puerto: ${port}`);
  console.log(`📊 Swagger API: http://localhost:${port}/api`);
  console.log(`======================================================\n`);
}
bootstrap();

