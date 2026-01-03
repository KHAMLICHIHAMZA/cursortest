// Script pour tester la connexion directement et afficher l'écran suivant
// À exécuter dans la console du navigateur sur http://localhost:8081

async function testLogin() {
  console.log('🔐 Test de connexion directe...');
  
  try {
    // Appel direct à l'API
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'agent1@autolocation.fr',
        password: 'agent123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Connexion réussie!', data);
    
    // Stocker le token
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    localStorage.setItem('agencies_data', JSON.stringify(data.agencies || []));
    localStorage.setItem('permissions_data', JSON.stringify(data.permissions || []));
    localStorage.setItem('modules_data', JSON.stringify(data.modules || []));
    
    console.log('✅ Token stocké dans localStorage');
    console.log('🔄 Rechargez la page pour voir l\'écran suivant');
    
    // Recharger la page
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
  }
}

// Exécuter le test
testLogin();




