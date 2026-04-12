// ============================================
// SCRIPT DE CONNEXION DIRECTE
// ============================================
// Copiez-collez ce script dans la console du navigateur (F12)
// sur http://localhost:8081
// ============================================

(async function connecterEtAfficher() {
  console.log('🔐 [Script] Démarrage de la connexion...');
  
  try {
    // 1. Connexion à l'API
    console.log('📡 [Script] Appel API login...');
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
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ [Script] Connexion réussie!');
    console.log('👤 [Script] User:', data.user?.email);
    console.log('🏢 [Script] Agences:', data.agencies?.length || 0);
    
    // 2. Stocker dans localStorage (comme le fait l'app)
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    localStorage.setItem('agencies_data', JSON.stringify(data.agencies || []));
    localStorage.setItem('permissions_data', JSON.stringify(data.permissions || []));
    localStorage.setItem('modules_data', JSON.stringify(data.modules || []));
    
    console.log('💾 [Script] Données stockées dans localStorage');
    console.log('🔄 [Script] Rechargement de la page dans 2 secondes...');
    
    // 3. Attendre un peu puis recharger
    setTimeout(() => {
      console.log('🔄 [Script] Rechargement maintenant!');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ [Script] Erreur:', error);
    alert('❌ Erreur de connexion:\n\n' + error.message + '\n\nVérifiez que le backend est démarré sur http://localhost:3000');
  }
})();




