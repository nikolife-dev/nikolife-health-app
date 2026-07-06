import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface RecipesSettingsCardProps {
  basicLimitPerCategory: number;
  setBasicLimitPerCategory: (value: number) => void;
  saveSettings: () => void;
  isSavingLimit: boolean;
}

export default function RecipesSettingsCard({
  basicLimitPerCategory,
  setBasicLimitPerCategory,
  saveSettings,
  isSavingLimit,
}: RecipesSettingsCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon name="Lock" size={16} className="text-[#748c6d]" />
            <span className="text-sm font-medium text-gray-700">Базовый тариф — рецептов в категории:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={basicLimitPerCategory}
              onChange={(e) => setBasicLimitPerCategory(Number(e.target.value))}
              className="w-20 h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={isSavingLimit}
              className="bg-[#748c6d] hover:bg-[#5a7052] h-8 text-xs"
            >
              {isSavingLimit ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Сохранить'}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Премиум — без ограничений</span>
        </div>
      </CardContent>
    </Card>
  );
}
