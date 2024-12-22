const { kafka, producer, connectProducer } = require('./config/kafka');

async function testKafkaIntegration() {
  try {
    console.log('Connecting to Kafka...');
    await connectProducer();
    
    const testPayment = {
      paymentId: 'test-payment-' + Date.now(),
      amount: 100,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString(),
      traceId: 'test-trace-' + Date.now()
    };

    console.log('Sending test payment:', testPayment);
    
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

    console.log('Message sent successfully:', result);
    
    // Wait a bit to see the consumer processing the message
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await producer.disconnect();
    console.log('Test completed');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testKafkaIntegration(); 