//const swaggerJsdoc = require('swagger-jsdoc');
import swaggerJsdoc from 'swagger-jsdoc'; //used to generate Swagger documentation from JSDoc comments in your code
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'QR Code API',
            version: '1.0.0',
            description: 'A simple API for generating and managing QR codes',
        },
    },
    apis: ['./app.js'], //array specifies the files or paths where the JSDoc comments are located
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
export default swaggerSpec;
// module.exports = swaggerSpec;