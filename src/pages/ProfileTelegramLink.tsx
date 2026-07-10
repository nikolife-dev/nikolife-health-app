import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import funcUrls from '../../backend/func2url.json';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileTelegramLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const linkTelegram = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const id = searchParams.get('id');
      const hash = searchParams.get('hash');
      if (!id || !hash) {
        setError('Неверные данные Telegram');
        return;
      }

      try {
        const response = await fetch(`${funcUrls.profile}?action=link_telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: parseInt(id),
            first_name: searchParams.get('first_name') || undefined,
            last_name: searchParams.get('last_name') || undefined,
            username: searchParams.get('username') || undefined,
            photo_url: searchParams.get('photo_url') || undefined,
            auth_date: parseInt(searchParams.get('auth_date') || '0'),
            hash,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          await refreshUser();
          navigate('/profile', { replace: true });
        } else {
          setError(data.error || 'Не удалось привязать Telegram');
        }
      } catch {
        setError('Произошла ошибка при привязке Telegram');
      }
    };

    linkTelegram();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-4 text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertCircle" size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Не получилось</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-4 py-2 bg-[#748c6d] text-white rounded-lg hover:bg-[#5a7052] transition-colors"
            >
              Вернуться в профиль
            </button>
          </>
        ) : (
          <>
            <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d] mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Привязываем Telegram</h2>
            <p className="text-gray-600">Пожалуйста, подождите...</p>
          </>
        )}
      </Card>
    </div>
  );
}
