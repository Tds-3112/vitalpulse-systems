const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VitalPulse Blood Bank API',
      version: '1.0.0',
      description: 'Production-grade Blood Bank Management System REST API',
      contact: { name: 'VitalPulse Systems', email: 'admin@vitalpulse.com' },
      license: { name: 'ISC' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}/api/v1`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
