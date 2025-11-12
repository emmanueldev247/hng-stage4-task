import * as amqp from 'amqplib';

async function sendTestMessage() {
  let connection;
  try {
    console.log('🔗 Connecting to RabbitMQ...');
    connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertExchange('notifications.direct', 'direct', {
      durable: true,
    });

    const message = {
      pattern: 'email.notification',
      data: {
        request_id: 'test-' + Date.now(),
        to: 'test@example.com',
        subject: 'Test Email from Professional Service',
        body: '<h1>Test Email</h1><p>This is a test email from the professional email service.</p><p>Time: ' + new Date().toISOString() + '</p>',
      }
    };

    channel.publish(
      'notifications.direct',
      'email.notification',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log('✅ Test message sent in professional format');

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestMessage();