import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
        client: 'admin',
      });
      const message = response.data?.message || 'Email envoyé si le compte existe';
      setSuccess(message);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de la demande';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D1F23] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-[#2C2F36] rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-[#3E7BFA]">
            Mot de passe oublié
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Entrez votre email pour recevoir un lien
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded">
                {success}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3E7BFA] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#2E6BEA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
