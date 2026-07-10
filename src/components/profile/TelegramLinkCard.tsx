import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TelegramLinkCardProps {
  telegramUsername?: string;
  telegramId?: number | null;
  onUnlink: () => void;
}

const BOT_USERNAME = 'nikolife_health_bot';

export default function TelegramLinkCard({
  telegramUsername,
  telegramId,
  onUnlink,
}: TelegramLinkCardProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const isLinked = !!telegramId;

  useEffect(() => {
    if (isLinked || !widgetRef.current) return;
    const authUrl = `${window.location.origin}/profile/telegram/link`;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    widgetRef.current.innerHTML = '';
    widgetRef.current.appendChild(script);
  }, [isLinked]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Send" size={20} className="text-[#229ED9]" />
        <h3 className="font-bold text-gray-900">Telegram</h3>
      </div>

      {isLinked ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Привязан аккаунт:{' '}
            <span className="font-medium text-gray-900">
              {telegramUsername ? `@${telegramUsername}` : `ID ${telegramId}`}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Вы получаете уведомления и напоминания в Telegram.
          </p>
          <Button
            variant="outline"
            onClick={onUnlink}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 min-h-[40px]"
          >
            <Icon name="Unlink" size={16} />
            Отвязать
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Привяжите Telegram, чтобы получать напоминания и уведомления в мессенджер.
          </p>
          <div ref={widgetRef} />
        </div>
      )}
    </Card>
  );
}
