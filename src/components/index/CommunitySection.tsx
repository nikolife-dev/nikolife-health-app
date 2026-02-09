import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'assistant' | 'community';
  description: string;
}

interface CommunitySectionProps {
  chats: Chat[];
}

export default function CommunitySection({ chats }: CommunitySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Сообщество</h2>
        <p className="text-gray-600">Общайтесь и делитесь опытом</p>
      </div>

      <div className="space-y-4">
        {chats.map((chat) => (
          <Card key={chat.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarFallback className={chat.type === 'assistant' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}>
                  {chat.type === 'assistant' ? '🤖' : '👥'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                    <p className="text-sm text-gray-600">{chat.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <Badge className="mt-2 bg-emerald-600">{chat.unread} новых</Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
