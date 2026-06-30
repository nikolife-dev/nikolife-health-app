import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface EditForm {
  name: string;
  email: string;
  receive_notifications: boolean;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: EditForm;
  setEditForm: (form: EditForm) => void;
  isSaving: boolean;
  onSave: () => void;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  isSaving,
  onSave,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
          <DialogDescription>
            Измените свои личные данные
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Полное имя</Label>
            <Input
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Введите ваше имя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="Введите ваш email"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[#748c6d]/20 bg-[#748c6d]/5">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-toggle" className="text-sm font-medium cursor-pointer">Получать рассылки</Label>
              <p className="text-xs text-[#4a5446]/60">Уведомления и новости в Telegram</p>
            </div>
            <Switch
              id="notifications-toggle"
              checked={editForm.receive_notifications}
              onCheckedChange={(checked) => setEditForm({ ...editForm, receive_notifications: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отмена
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !editForm.name.trim() || !editForm.email.trim()}
            className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
          >
            {isSaving ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
