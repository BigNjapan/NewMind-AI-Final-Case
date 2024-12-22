const { kafka, producer, connectProducer } = require('../config/kafka');

describe('Kafka Producer Tests', () => {
  beforeAll(async () => {
    await connectProducer();
  });

  afterAll(async () => {
    await producer.disconnect();
  });

  test('should successfully connect to Kafka', async () => {
    const isConnected = producer.isConnected();
    expect(isConnected).toBe(true);
  });

  test('should successfully send a payment message', async () => {
    const testPayment = {
      paymentId: 'test-payment-' + Date.now(),
      amount: 100,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString(),
      traceId: 'test-trace-' + Date.now()
    };

    const result = await producer.send({
      topic: 'payment-completed',
      messages: [{
        key: testPayment.paymentId,
        value: JSON.stringify(testPayment),
        headers: {
          traceId: testPayment.traceId
        }
      }]
    });

    expect(result).toBeDefined();
    expect(result[0].errorCode).toBe(0);
  });
}); 