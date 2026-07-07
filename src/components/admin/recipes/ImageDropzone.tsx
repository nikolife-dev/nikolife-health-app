import { useRef, useState, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { compressImage } from '@/lib/compressImage';

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

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [pasteError, setPasteError] = useState('');

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const compressed = await compressImage(file);
      onFileSelected(compressed);
    },
    [onFileSelected],
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  useEffect(() => {
    if (!pasteError) return;
    const t = setTimeout(() => setPasteError(''), 4000);
    return () => clearTimeout(t);
  }, [pasteError]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPasteError('');
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const handlePasteFromClipboard = async () => {
    setMenu(null);
    setPasteError('');
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setPasteError('Браузер не поддерживает вставку из буфера');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard.${ext}`, { type: imageType });
          await processFile(file);
          return;
        }
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        try {
          new URL(text);
          onUrlSelected(text, true);
          return;
        } catch {
          setPasteError('В буфере нет изображения или ссылки');
          return;
        }
      }
      setPasteError('В буфере обмена нет изображения');
    } catch {
      setPasteError('Не удалось получить доступ к буферу обмена');
    }
  };

  const handlePasteByLink = () => {
    setMenu(null);
    const link = window.prompt('Вставьте ссылку на изображение');
    if (!link) return;
    const url = link.trim();
    try {
      new URL(url);
    } catch {
      setPasteError('Некорректная ссылка');
      return;
    }
    onUrlSelected(url, true);
  };

  const contextMenu = menu ? (
    <div
      className="fixed z-[100] min-w-[220px] rounded-md border border-border bg-white shadow-lg py-1"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handlePasteFromClipboard}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
      >
        <Icon name="ClipboardPaste" size={15} />
        Вставить фото из буфера
      </button>
      <button
        type="button"
        onClick={handlePasteByLink}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
      >
        <Icon name="Link" size={15} />
        Вставить фото по ссылке
      </button>
      <button
        type="button"
        onClick={() => { setMenu(null); inputRef.current?.click(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
      >
        <Icon name="Upload" size={15} />
        Выбрать файл
      </button>
      {imagePreview && (
        <button
          type="button"
          onClick={() => { setMenu(null); onClear(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icon name="Trash2" size={15} />
          Удалить фото
        </button>
      )}
    </div>
  ) : null;

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
      <>
        <div
          className="relative group w-full h-48 rounded-lg overflow-hidden border border-border"
          onContextMenu={handleContextMenu}
        >
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
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Icon name="MousePointerClick" size={11} />
            ПКМ — вставить фото
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
        </div>
        {pasteError && <p className="text-xs text-red-500 mt-1">{pasteError}</p>}
        {contextMenu}
      </>
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
          onContextMenu={handleContextMenu}
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
          <p className="text-xs text-muted-foreground">ПКМ — вставить из буфера или по ссылке</p>
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

      {pasteError && <p className="text-xs text-red-500">{pasteError}</p>}
      {contextMenu}
    </div>
  );
}
