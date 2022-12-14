import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, HttpStatus } from '@nestjs/common';

describe('AppController (e2e): Specification to work with a local database variable', () => {
  let app: INestApplication;
  let server: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const response = request(server).get('/');

    await response.expect(HttpStatus.OK).expect('Hello World!');
  });

  it('/reset - Reset state before starting tests', async () => {
    const endpoint = '/reset';
    const expect = {
      status: HttpStatus.OK,
      content: 'OK',
    };
    const response = request(server).post(endpoint);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/balance - Get balance for non-existing account', async () => {
    const endpoint = '/balance?account_id=1234';
    const expect = {
      status: HttpStatus.NOT_FOUND,
      content: '0',
    };
    const response = request(server).get(endpoint);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Create account with initial balance', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'deposit', destination: '100', amount: 10 },
    };
    const expect = {
      status: HttpStatus.CREATED,
      content: { destination: { id: '100', balance: 10 } },
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Deposit into existing account', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'deposit', destination: '100', amount: 10 },
    };
    const expect = {
      status: HttpStatus.CREATED,
      content: { destination: { id: '100', balance: 20 } },
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/balance - Get balance for existing account', async () => {
    const endpoint = '/balance?account_id=100';
    const expect = {
      status: HttpStatus.OK,
      content: '20',
    };
    const response = request(server).get(endpoint);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Withdraw from non-existing account', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'withdraw', origin: '200', amount: 10 },
    };
    const expect = {
      status: HttpStatus.NOT_FOUND,
      content: '0',
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Withdraw from existing account', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'withdraw', origin: '100', amount: 5 },
    };
    const expect = {
      status: HttpStatus.CREATED,
      content: { origin: { id: '100', balance: 15 } },
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Transfer from existing account', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'transfer', origin: '100', amount: 15, destination: '300' },
    };
    const expect = {
      status: HttpStatus.CREATED,
      content: {
        origin: { id: '100', balance: 0 },
        destination: { id: '300', balance: 15 },
      },
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });

  it('/event - Transfer from non-existing account', async () => {
    const endpoint = '/event';
    const req = {
      body: { type: 'transfer', origin: '200', amount: 15, destination: '300' },
    };
    const expect = {
      status: HttpStatus.NOT_FOUND,
      content: '0',
    };
    const response = request(server).post(endpoint).send(req.body);

    await response.expect(expect.status).expect(expect.content);
  });
});
