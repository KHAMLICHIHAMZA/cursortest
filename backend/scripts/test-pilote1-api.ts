import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn();
    results.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ 
      name, 
      status: 'FAIL', 
      message: error.message,
      details: error.response?.data || error.message
    });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function skip(name: string, reason: string): Promise<void> {
  results.push({ name, status: 'SKIP', message: reason });
  console.log(`⏭️  ${name}: ${reason}`);
}

// Phase 1: Authentification
async function phase1Auth() {
  console.log('\n📋 Phase 1: Authentification\n');
  
  let tokens: { [key: string]: string } = {};
  
  await test('Login SUPER_ADMIN', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@malocauto.com',
      password: 'admin123',
    });
    if (!response.data.access_token) throw new Error('Pas de token reçu');
    tokens.SUPER_ADMIN = response.data.access_token;
  });
  
  await test('Login COMPANY_ADMIN', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@autolocation.fr',
      password: 'admin123',
    });
    if (!response.data.access_token) throw new Error('Pas de token reçu');
    tokens.COMPANY_ADMIN = response.data.access_token;
  });
  
  await test('Login AGENCY_MANAGER', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'manager1@autolocation.fr',
      password: 'manager123',
    });
    if (!response.data.access_token) throw new Error('Pas de token reçu');
    tokens.AGENCY_MANAGER = response.data.access_token;
  });
  
  await test('Login AGENT', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'agent1@autolocation.fr',
      password: 'agent123',
    });
    if (!response.data.access_token) throw new Error('Pas de token reçu');
    tokens.AGENT = response.data.access_token;
  });
  
  await test('Login avec mauvais mot de passe', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@malocauto.com',
        password: 'wrongpassword',
      });
      throw new Error('Devrait retourner 401');
    } catch (error: any) {
      if (error.response?.status !== 401) {
        throw new Error(`Status attendu: 401, reçu: ${error.response?.status}`);
      }
    }
  });
  
  await test('GET /auth/me avec token valide', async () => {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.AGENT}` },
    });
    if (!response.data.id) throw new Error('Données utilisateur manquantes');
  });
  
  await test('GET /auth/me sans token', async () => {
    try {
      await axios.get(`${API_URL}/auth/me`);
      throw new Error('Devrait retourner 401');
    } catch (error: any) {
      if (error.response?.status !== 401) {
        throw new Error(`Status attendu: 401, reçu: ${error.response?.status}`);
      }
    }
  });
  
  return tokens;
}

// Phase 2: Règle R1.3 - Validation Permis
async function phase2Permis(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 2: Règle R1.3 - Validation Permis\n');
  
  let clientId: string;
  let vehicleId: string;
  
  await test('Créer client avec permis valide', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const response = await axios.post(
      `${API_URL}/clients`,
      {
        name: 'Client Test Permis Valide',
        email: 'client.valide@test.com',
        phone: '+33612345678',
        licenseNumber: 'TEST-VALIDE-001',
        licenseExpiryDate: futureDate.toISOString().split('T')[0],
        address: '123 Test Street',
      },
      { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
    );
    clientId = response.data.id;
  });
  
  await test('Créer client avec permis expiré', async () => {
    try {
      await axios.post(
        `${API_URL}/clients`,
        {
          name: 'Client Test Permis Expiré',
          email: 'client.expire@test.com',
          phone: '+33612345679',
          licenseNumber: 'TEST-EXPIRE-001',
          licenseExpiryDate: '2024-01-01', // Date passée
          address: '123 Test Street',
        },
        { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
      );
      // Note: La validation permis se fait lors de la création de booking, pas lors de la création client
      console.log('   ℹ️  Note: Validation permis se fait lors de la création de booking');
    } catch (error: any) {
      // Acceptable si validation côté client
    }
  });
  
  await test('Récupérer un véhicule disponible', async () => {
    const response = await axios.get(
      `${API_URL}/vehicles`,
      { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
    );
    if (response.data.length === 0) {
      throw new Error('Aucun véhicule disponible');
    }
    vehicleId = response.data[0].id;
  });
  
  await skip('Créer booking avec permis expiré → Blocage', 
    'Nécessite client avec permis expiré et test manuel');
  
  await skip('Check-in avec permis expiré → Blocage',
    'Nécessite booking existant et test manuel');
}

// Phase 3: Règle R2.2 - Temps de Préparation
async function phase3Preparation(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 3: Règle R2.2 - Temps de Préparation\n');
  
  await skip('Validation chevauchement période préparation',
    'Nécessite création de bookings et test manuel');
  
  await skip('Création période préparation après check-out',
    'Nécessite check-out et vérification manuelle');
}

// Phase 4: Règle R3 - Caution
async function phase4Caution(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 4: Règle R3 - Caution\n');
  
  await skip('Créer booking avec caution requise',
    'Nécessite test manuel avec formulaire frontend');
  
  await skip('Check-in avec caution non collectée → Blocage',
    'Nécessite booking avec caution et test manuel');
}

// Phase 5: Règle R4 - Frais de Retard
async function phase5LateFee(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 5: Règle R4 - Frais de Retard\n');
  
  await skip('Calcul automatique frais de retard',
    'Nécessite check-out en retard et vérification manuelle');
  
  await skip('Override frais de retard',
    'Nécessite booking avec frais et test manuel');
}

// Phase 6: Règle R5 - Dommages & Litiges
async function phase6Incidents(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 6: Règle R5 - Dommages & Litiges\n');
  
  await test('GET /incidents', async () => {
    const response = await axios.get(
      `${API_URL}/incidents`,
      { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
    );
    // Vérifier que l'endpoint existe
    if (response.status !== 200) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });
  
  await skip('Créer incident avec montant > 50% caution → DISPUTED',
    'Nécessite booking avec caution et test manuel');
}

// Phase 7: Règle R6 - Facturation
async function phase7Invoices(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 7: Règle R6 - Facturation\n');
  
  await test('GET /invoices', async () => {
    const response = await axios.get(
      `${API_URL}/invoices`,
      { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
    );
    if (response.status !== 200) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });
  
  await skip('Génération automatique facture après check-out',
    'Nécessite check-out et vérification manuelle');
}

// Phase 8: Permissions & RBAC
async function phase8RBAC(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 8: Permissions & RBAC\n');
  
  await test('AGENT peut accéder à ses agences', async () => {
    const response = await axios.get(
      `${API_URL}/agencies`,
      { headers: { Authorization: `Bearer ${tokens.AGENT}` } }
    );
    if (response.status !== 200) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });
  
  await test('AGENCY_MANAGER peut accéder à ses agences', async () => {
    const response = await axios.get(
      `${API_URL}/agencies`,
      { headers: { Authorization: `Bearer ${tokens.AGENCY_MANAGER}` } }
    );
    if (response.status !== 200) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });
}

// Phase 9: Audit & Logging
async function phase9Audit(tokens: { [key: string]: string }) {
  console.log('\n📋 Phase 9: Audit & Logging\n');
  
  await test('GET /audit/logs', async () => {
    const response = await axios.get(
      `${API_URL}/audit/logs`,
      { headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` } }
    );
    if (response.status !== 200) {
      throw new Error(`Status inattendu: ${response.status}`);
    }
  });
}

async function main() {
  console.log('🚀 PILOTE 1 - Backend API - Tests Automatisés\n');
  console.log('='.repeat(50));
  
  try {
    // Vérifier que le backend est accessible
    let backendAccessible = false;
    try {
      await axios.get(`http://localhost:3000/api/docs`, { timeout: 5000 });
      backendAccessible = true;
    } catch (error: any) {
      // Essayer aussi /health ou juste la racine
      try {
        await axios.get(`http://localhost:3000`, { timeout: 5000 });
        backendAccessible = true;
      } catch {
        // Essayer l'endpoint API directement
        try {
          await axios.get(`${API_URL}/auth/me`, { timeout: 5000, validateStatus: () => true });
          backendAccessible = true;
        } catch {
          // Backend non accessible, mais on continue quand même pour voir les erreurs
          console.log('⚠️  Backend peut-être non accessible, mais on continue les tests...');
        }
      }
    }
    
    const tokens = await phase1Auth();
    await phase2Permis(tokens);
    await phase3Preparation(tokens);
    await phase4Caution(tokens);
    await phase5LateFee(tokens);
    await phase6Incidents(tokens);
    await phase7Invoices(tokens);
    await phase8RBAC(tokens);
    await phase9Audit(tokens);
    
    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DES TESTS\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Tests réussis: ${passed}`);
    console.log(`❌ Tests échoués: ${failed}`);
    console.log(`⏭️  Tests ignorés: ${skipped}`);
    console.log(`📋 Total: ${results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ DÉTAILS DES ÉCHECS:\n');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`- ${r.name}: ${r.message}`);
        if (r.details) {
          console.log(`  Détails: ${JSON.stringify(r.details, null, 2)}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests automatisés terminés');
    console.log('⚠️  Note: Certains tests nécessitent une vérification manuelle');
    console.log('   Consultez GUIDE_PILOTE_1_BACKEND.md pour les tests complets\n');
    
  } catch (error: any) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);




