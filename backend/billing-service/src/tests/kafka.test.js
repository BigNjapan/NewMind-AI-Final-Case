const { kafka, consumer, connectConsumer } = require('../config/kafka');

describe('Kafka Consumer Tests', () => {
  beforeAll(async () => {
    await connectConsumer();
  });

  afterAll(async () => {
    await consumer.disconnect();
  });

  test('should successfully connect to Kafka', async () => {
    expect(consumer.isRunning()).toBe(true);
  });

  test('should receive and process payment message', (done) => {
    // Set timeout for test
    jest.setTimeout(30000);

    // Create a test producer
    const testProducer = kafka.producer();
    
    const testPayment = {
      paymentId: 'test-payment-' + Date.now(),
      amount: 100,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString(),
      traceId: 'test-trace-' + Date.now()
    };

    // Setup message handler
    consumer.on(consumer.events.MESSAGE, async ({ message }) => {
      try {
        const receivedPayment = JSON.parse(message.value.toString());
        expect(receivedPayment.paymentId).toBe(testPayment.paymentId);
        expect(receivedPayment.amount).toBe(testPayment.amount);
        await testProducer.disconnect();
        done();
      } catch (error) {
        done(error);
      }
    });

    // Send test message
    testProducer.connect()
      .then(() => testProducer.send({
        topic: 'payment-completed',
        messages: [{
          key: testPayment.paymentId,
          value: JSON.stringify(testPayment),
          headers: {
            traceId: testPayment.traceId
          }
        }]
      }))
      .catch(done);
  });
}); 