const request = require('supertest');
const app = require('../src/index'); // Adjust the path if necessary

describe('GET /', () => {
    it('should respond with a 200 status code', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    it('should respond with JSON', async () => {
        const response = await request(app).get('/');
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });
});

// Add more tests as needed for other routes and functionalities.