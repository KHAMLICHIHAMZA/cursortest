import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { setStoredToken, setStoredUser } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;

      if (!accessToken || !user) {
        setError('Réponse invalide du serveur');
        setLoading(false);
        return;
      }

      if (user.role !== 'SUPER_ADMIN') {
        setError('Accès réservé aux administrateurs');
        setLoading(false);
        return;
      }

      setStoredToken(accessToken);
      setStoredUser(user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Erreur de connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D1F23] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-[#2C2F36] rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-[#3E7BFA]">
            MalocAuto
          </h1>
          <p className="text-center text-gray-400 mb-8">Administration</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#3E7BFA]"
                placeholder="admin@malocauto.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#3E7BFA]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3E7BFA] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#2E6BEA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Compte de test: admin@malocauto.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}






