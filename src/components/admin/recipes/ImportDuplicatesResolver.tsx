import Icon from '@/components/ui/icon';
import { Duplicate, DuplicateDecision } from './importRecipesParsers';

interface ImportDuplicatesResolverProps {
  duplicates: Duplicate[];
  decisions: Record<string, DuplicateDecision>;
  setDecisions: React.Dispatch<React.SetStateAction<Record<string, DuplicateDecision>>>;
}

export default function ImportDuplicatesResolver({
  duplicates,
  decisions,
  setDecisions,
}: ImportDuplicatesResolverProps) {
  if (duplicates.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 overflow-hidden">
      <div className="px-4 py-2 bg-yellow-100 text-sm font-medium text-yellow-800 flex items-center gap-2">
        <Icon name="AlertTriangle" size={16} />
        Найдены совпадения по названию — выберите действие для каждого
      </div>
      <div className="divide-y">
        {duplicates.map(d => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <span className="text-sm font-medium text-gray-800 flex-1">{d.title}</span>
            <div className="flex gap-2">
              {(['replace', 'add', 'skip'] as DuplicateDecision[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDecisions(prev => ({ ...prev, [d.title]: opt }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    decisions[d.title] === opt
                      ? opt === 'replace' ? 'bg-blue-600 text-white border-blue-600'
                        : opt === 'add' ? 'bg-[#748c6d] text-white border-[#748c6d]'
                        : 'bg-gray-500 text-white border-gray-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {opt === 'replace' ? 'Заменить' : opt === 'add' ? 'Оставить оба' : 'Пропустить'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
