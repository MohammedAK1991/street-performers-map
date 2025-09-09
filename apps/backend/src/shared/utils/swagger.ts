import type { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export function setupSwagger(app: Application) {
	try {
		// Read the OpenAPI specification
		const swaggerPath = path.join(__dirname, '../../../docs/api.yml');
		const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, 'utf8')) as any;

		// Update server URLs based on environment
		const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
		swaggerDocument.servers = [
			{
				url: baseUrl,
				description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
			}
		];

		// Swagger UI options
		const swaggerUiOptions = {
			customCss: `
				.swagger-ui .topbar { display: none }
				.swagger-ui .info .title { color: #3b82f6 }
				.swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
			`,
			customSiteTitle: 'StreetPerformersMap API Documentation',
			customfavIcon: '/favicon.ico',
			swaggerOptions: {
				persistAuthorization: true,
				displayRequestDuration: true,
				filter: true,
				showExtensions: true,
				tryItOutEnabled: true,
			}
		};

		// Serve API documentation
		app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

		// Serve raw OpenAPI spec
		app.get('/api/openapi.json', (req, res) => {
			res.json(swaggerDocument);
		});

		app.get('/api/openapi.yml', (req, res) => {
			res.type('text/yaml');
			res.send(yaml.dump(swaggerDocument));
		});

		logger.info('📚 API documentation available at /api/docs');

	} catch (error) {
		logger.error('❌ Failed to setup Swagger documentation:', error);
	}
}

// Generate TypeScript types from OpenAPI spec (development utility)
export function generateTypes() {
	if (process.env.NODE_ENV !== 'development') return;

	try {
		// This could be expanded to auto-generate TypeScript interfaces
		// from the OpenAPI specification using tools like openapi-typescript
		logger.info('🔧 Type generation would run here in development mode');
	} catch (error) {
		logger.error('❌ Failed to generate types:', error);
	}
}