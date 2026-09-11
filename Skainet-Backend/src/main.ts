import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuración de Swagger para Backend Worker & Automatización
  const config = new DocumentBuilder()
    .setTitle('Skainet Core - Backend Worker & Automation Engine')
    .setDescription('Servicio de procesamiento en segundo plano, automatizaciones, detección de mermas y telemetría IoT.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`\n======================================================`);
  console.log(`⚙️  Skainet Backend Worker & Automation activo en puerto: ${port}`);
  console.log(`📊 Swagger Worker: http://localhost:${port}/api`);
  console.log(`======================================================\n`);
}
bootstrap();

