"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Skainet Core - Backend Worker & Automation Engine')
        .setDescription('Servicio de procesamiento en segundo plano, automatizaciones, detección de mermas y telemetría IoT.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT ?? 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`\n======================================================`);
    console.log(`⚙️  Skainet Backend Worker & Automation activo en puerto: ${port}`);
    console.log(`📊 Swagger Worker: http://localhost:${port}/api`);
    console.log(`======================================================\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map