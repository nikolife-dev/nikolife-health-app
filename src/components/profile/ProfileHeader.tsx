import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface ProfileHeaderProps {
  userProfile: {
    name: string;
    email: string;
    avatar: string;
  };
  currentPlan: {
    name: string;
    icon: string;
  };
  onEditClick: () => void;
}

export default function ProfileHeader({ userProfile, currentPlan, onEditClick }: ProfileHeaderProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="w-32 h-32">
          <AvatarFallback className="text-4xl bg-gradient-to-br from-[#748c6d] to-[#5a7052] text-white">
            {userProfile.avatar}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
          <p className="text-gray-600 mt-1">{userProfile.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={onEditClick}
          className="w-full gap-2"
        >
          <Icon name="Edit2" size={16} />
          Редактировать профиль
        </Button>
        <Badge className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] text-white">
          <Icon name={currentPlan.icon as "Sparkles"} size={14} className="mr-1" />
          {currentPlan.name}
        </Badge>
      </div>
    </Card>
  );
}
