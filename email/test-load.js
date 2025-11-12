const amqp = require('amqplib');

async function sendLoadTest() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  await channel.assertExchange('notifications.direct', 'direct', { durable: true });
  
  console.log('🚀 Sending professional load test...');
  
  for (let i = 0; i < 5; i++) {
    const message = {
      pattern: 'email.notification',
      data: {
        request_id: `load-test-${Date.now()}-${i}`,
        to: `user${i}@example.com`,
        subject: `Welcome User ${i + 1}!`,
        body: `<h1>Welcome User ${i + 1}!</h1><p>Thank you for joining our professional platform.</p><p>This is load test email ${i + 1}</p>`
      }
    };
    
    channel.publish(
      'notifications.direct', 
      'email.notification', 
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log(`📤 Sent professional message ${i + 1}`);
  }
  
  await channel.close();
  await connection.close();
  console.log('✅ Professional load test completed - 5 messages sent');
}

sendLoadTest().catch(console.error);