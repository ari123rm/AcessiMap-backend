// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Acessibilidade de Empreendimentos',
      version: '1.0.0',
      description: 'Documentação da API utilizando arquivos YAML separados.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento Local',
      },
    ],
    // Os componentes (schemas, securitySchemes) ficam aqui, no arquivo principal.
    // Assim, eles podem ser referenciados por todos os outros arquivos.
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Categoria: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
          },
          example: {
            id: 1,
            nome: 'Mobilidade',
          },
        },
        // Você pode adicionar outros schemas globais aqui (Usuario, Item, etc.)
      },
    },
  },
  // ATENÇÃO: A MUDANÇA PRINCIPAL É AQUI!
  // Agora vamos apontar para todos os arquivos .yaml dentro das pastas de features.
  apis: ['./src/feat/**/*.yaml'], 
};

const specs = swaggerJsdoc(swaggerOptions);

module.exports = {
  specs
};