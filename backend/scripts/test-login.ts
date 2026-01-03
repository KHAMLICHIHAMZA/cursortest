import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testLogin() {
  console.log('🔐 Test de connexion...\n');

  const testUsers = [
    { email: 'agent1@autolocation.fr', password: 'agent123', name: 'Agent' },
    { email: 'manager1@autolocation.fr', password: 'manager123', name: 'Manager' },
    { email: 'admin@autolocation.fr', password: 'admin123', name: 'Admin' },
  ];

  for (const user of testUsers) {
    try {
      console.log(`Test connexion ${user.name} (${user.email})...`);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: user.password,
      });

      if (response.data.access_token) {
        console.log(`✅ ${user.name}: Connexion réussie`);
        console.log(`   - Token: ${response.data.access_token.substring(0, 20)}...`);
        console.log(`   - User ID: ${response.data.user?.id || 'N/A'}`);
        console.log(`   - Agences: ${response.data.agencies?.length || 0}`);
        console.log(`   - Modules: ${response.data.modules?.length || 0}`);
      } else {
        console.log(`⚠️  ${user.name}: Connexion réussie mais pas de token`);
      }
    } catch (error: any) {
      console.log(`❌ ${user.name}: Échec de la connexion`);
      if (error.response) {
        console.log(`   - Status: ${error.response.status}`);
        console.log(`   - Message: ${error.response.data?.message || error.response.data?.error || 'Erreur inconnue'}`);
      } else if (error.request) {
        console.log(`   - Erreur: Pas de réponse du serveur (backend démarré?)`);
      } else {
        console.log(`   - Erreur: ${error.message}`);
      }
    }
    console.log('');
  }
}

testLogin().catch(console.error);




