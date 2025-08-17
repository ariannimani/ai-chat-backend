import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';
import { ValidateInputPipe } from './config/pipe/validate.pipe';

async function generateSwaggerJson() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule, { logger: false });

  // Apply the global validation pipe (same as in main.ts)
  app.useGlobalPipes(new ValidateInputPipe());

  // Create Swagger configuration (same as in SwaggerConfig)
  const config = new DocumentBuilder()
    .setTitle('NestJS Chat App API')
    .setDescription('NestJS Chat App API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  // Generate the Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Write the JSON to a file
  writeFileSync('swagger-api-docs.json', JSON.stringify(document, null, 2));

  console.log('✅ Swagger JSON documentation generated successfully!');
  console.log('📄 File saved as: swagger-api-docs.json');
  console.log(
    '📊 API endpoints found:',
    Object.keys(document.paths || {}).length,
  );

  // Display a summary of available endpoints
  if (document.paths) {
    console.log('\n📋 API Endpoints Summary:');
    Object.entries(document.paths).forEach(([path, methods]) => {
      const availableMethods = Object.keys(methods as any).filter(
        (key) => key !== 'parameters',
      );
      console.log(`  ${path} - [${availableMethods.join(', ').toUpperCase()}]`);
    });
  }

  // Close the application
  await app.close();

  console.log('\n🎉 Complete! You can now use the swagger-api-docs.json file.');
}

// Run the generator
generateSwaggerJson().catch((error) => {
  console.error('❌ Error generating Swagger JSON:', error);
  process.exit(1);
});
