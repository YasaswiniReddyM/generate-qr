// spec/app.spec.js

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('POST /generate-qr', () => {
  beforeAll(() => {
    // Mocking mongoose connect and disconnect methods
    spyOn(mongoose, 'connect').and.returnValue(Promise.resolve());
    spyOn(mongoose, 'disconnect').and.returnValue(Promise.resolve());
  });

  it('should generate a QR code for a valid URL', async () => {
    const response = await request(app)
      .post('/generate-qr')
      .send({ url: 'https://example.com' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
  });

  it('should return a 400 error for an invalid URL', async () => {
    const response = await request(app)
      .post('/generate-qr')
      .send({ url: 'https://www.google3.com' });

    expect(response.statusCode).toBe(400);
  });
});
