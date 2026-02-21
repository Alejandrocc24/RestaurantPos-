import fetch from 'node-fetch';

async function testLogin() {
  const apiUrl = 'http://localhost:3001/api/auth/login';
  const email = 'desarrollador@dulcemomento';
  const password = 'Desarrollo123';

  console.log('📝 Probando login...');
  console.log(`  Email: ${email}`);
  console.log(`  Contraseña: ${password}`);
  console.log('');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json() as any;

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.success) {
      console.log('✅ Login exitoso!');
      console.log(`Token: ${data.data.accessToken.substring(0, 50)}...`);
    } else {
      console.log('❌ Login fallido');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();
