import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { CHANNELS } from './notificationsShared';

interface NotificationFormFieldsProps {
  formTitle: string;
  setFormTitle: (value: string) => void;
  formText: string;
  setFormText: React.Dispatch<React.SetStateAction<string>>;
  selectedChannels: string[];
  toggleChannel: (channelId: string) => void;
  titlePlaceholder?: string;
  textPlaceholder?: string;
}

export default function NotificationFormFields({
  formTitle,
  setFormTitle,
  formText,
  setFormText,
  selectedChannels,
  toggleChannel,
  titlePlaceholder,
  textPlaceholder,
}: NotificationFormFieldsProps) {
  return (
    <>
      <div>
        <Label>Название</Label>
        <Input
          placeholder={titlePlaceholder}
          maxLength={60}
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
        />
      </div>
      <div>
        <Label>Текст сообщения</Label>
        <Textarea
          placeholder={textPlaceholder}
          rows={4}
          maxLength={1000}
          value={formText}
          onChange={(e) => setFormText(e.target.value)}
        />
        <div className="mt-2 p-3 bg-[#748c6d]/5 rounded-lg border border-[#748c6d]/15">
          <p className="text-xs font-medium text-[#4a5446]/80 mb-1.5">Доступные теги (подставятся для каждого получателя):</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { tag: '{имя}', desc: 'имя пользователя' },
              { tag: '{привычка}', desc: 'название привычки' },
              { tag: '{цель}', desc: 'цель привычки' },
            ].map(t => (
              <button
                key={t.tag}
                type="button"
                onClick={() => setFormText(prev => prev + t.tag)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#748c6d]/20 text-xs text-[#748c6d] hover:bg-[#748c6d]/10 transition-colors cursor-pointer"
                title={`Вставить ${t.tag} — ${t.desc}`}
              >
                <code className="font-mono font-semibold">{t.tag}</code>
                <span className="text-[#4a5446]/50">— {t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label>Каналы рассылки</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] ${
                selectedChannels.includes(ch.id)
                  ? 'border-[#748c6d] bg-[#748c6d]/10 text-[#748c6d]'
                  : 'border-gray-200 bg-white text-[#4a5446]/60 hover:border-gray-300'
              }`}
            >
              <Icon name={ch.icon} size={18} />
              <span className="font-medium text-sm">{ch.label}</span>
              {selectedChannels.includes(ch.id) && (
                <Icon name="Check" size={16} className="text-[#748c6d]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
