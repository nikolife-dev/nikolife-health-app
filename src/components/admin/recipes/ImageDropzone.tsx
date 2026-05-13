import { useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface ImageDropzoneProps {
  imagePreview: string | null;
  onFileSelected: (file: File) => void;
  onUrlSelected: (url: string, copy: boolean) => void;
  onClear: () => void;
}

export default function ImageDropzone({
  imagePreview,
  onFileSelected,
  onUrlSelected,
  onClear,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [urlValue, setUrlValue] = useState('');
  const [copyToStorage, setCopyToStorage] = useState(false);
  const [urlError, setUrlError] = useState('');

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlApply = () => {
    const url = urlValue.trim();
    if (!url) {
      setUrlError('Введите ссылку');
      return;
    }
    try {
      new URL(url);
    } catch {
      setUrlError('Некорректная ссылка');
      return;
    }
    setUrlError('');
    onUrlSelected(url, copyToStorage);
  };

  if (imagePreview) {
    return (
      <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-border">
        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 bg-white text-black text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Icon name="RefreshCw" size={14} />
            Заменить файл
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
          >
            <Icon name="Trash2" size={14} />
            Удалить
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex rounded-md border border-border overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${tab === 'file' ? 'bg-[#748c6d] text-white' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Icon name="Upload" size={13} />Файл
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${tab === 'url' ? 'bg-[#748c6d] text-white' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Icon name="Link" size={13} />Ссылка
        </button>
      </div>

      {tab === 'file' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-36 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none ${
            isDragging
              ? 'border-[#748c6d] bg-[#748c6d]/10'
              : 'border-border hover:border-[#748c6d] hover:bg-muted/50'
          }`}
        >
          <Icon name="ImageUp" size={32} className={isDragging ? 'text-[#748c6d]' : 'text-muted-foreground'} />
          <p className="text-sm text-muted-foreground text-center">
            {isDragging ? 'Отпустите, чтобы загрузить' : 'Перетащите фото сюда или нажмите для выбора'}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · до 5 МБ</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
        </div>
      )}

      {tab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/photo.jpg"
              value={urlValue}
              onChange={(e) => { setUrlValue(e.target.value); setUrlError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlApply()}
              className={urlError ? 'border-red-400' : ''}
            />
            <button
              type="button"
              onClick={handleUrlApply}
              className="px-3 py-2 bg-[#748c6d] text-white rounded-md text-sm hover:bg-[#5a7052] transition-colors whitespace-nowrap"
            >
              Применить
            </button>
          </div>
          {urlError && <p className="text-xs text-red-500">{urlError}</p>}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={copyToStorage}
              onChange={(e) => setCopyToStorage(e.target.checked)}
              className="w-4 h-4 accent-[#748c6d]"
            />
            <span className="text-xs text-muted-foreground">Скопировать в хранилище сервиса</span>
          </label>
        </div>
      )}
    </div>
  );
}
