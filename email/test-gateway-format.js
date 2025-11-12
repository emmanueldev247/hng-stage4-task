const amqp = require('amqplib');

async function testGatewayFormat() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  await channel.assertExchange('notifications.direct', 'direct', { durable: true });
  
  console.log('📨 Testing Professional Gateway Format...');
  
  const gatewayMessage = {
    pattern: 'email.notification',
    data: {
      request_id: 'gateway-pro-' + Date.now(),
      to: 'professional.user@company.com',
      subject: 'Professional Welcome Email',
      body: '<h1>Welcome to Our Professional Service</h1><p>We are excited to have you on board. Your account has been successfully created.</p><p><strong>Team Professional</strong></p>'
    }
  };

  channel.publish(
    'notifications.direct', 
    'email.notification',
    Buffer.from(JSON.stringify(gatewayMessage)),
    { persistent: true }
  );
  
  await channel.close();
  await connection.close();
  
  console.log('✅ Professional gateway test sent!');
  console.log('🎯 Includes minimal validation-ready format');
}

testGatewayFormat().catch(console.error);