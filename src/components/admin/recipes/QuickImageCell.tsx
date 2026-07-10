import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../../backend/func2url.json';
import { compressImage } from '@/lib/compressImage';

const RECIPES_API = funcUrls.recipes;

interface QuickImageCellProps {
  recipeId: number;
  imageUrl: string | null;
  recipeTitle: string;
  onUpdated: () => void;
}

export default function QuickImageCell({ recipeId, imageUrl, recipeTitle, onUpdated }: QuickImageCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const menuW = 210;
    const menuH = preview ? 176 : 132;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setMenu({ x: Math.max(8, x), y: Math.max(8, y) });
  };

  const pasteFromClipboard = async () => {
    setMenu(null);
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split('/')[1] || 'png';
            await uploadFile(new File([blob], `clipboard.${ext}`, { type: imageType }));
            return;
          }
        }
      }
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        try {
          new URL(text);
          applyUrl(text);
        } catch {
          /* not a url */
        }
      }
    } catch {
      /* clipboard denied */
    }
  };

  const pasteByLink = () => {
    setMenu(null);
    const link = window.prompt('Вставьте ссылку на изображение');
    if (!link) return;
    const url = link.trim();
    try {
      new URL(url);
    } catch {
      return;
    }
    applyUrl(url);
  };

  const removeImage = async () => {
    setMenu(null);
    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?id=${recipeId}`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': token!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: '' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreview(null);
        onUpdated();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const contextMenu = menu ? createPortal(
    <div
      className="fixed z-[100] min-w-[210px] rounded-md border border-border bg-white shadow-lg py-1"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={pasteFromClipboard}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors"
      >
        <Icon name="ClipboardPaste" size={15} />
        Вставить фото из буфера
      </button>
      <button
        type="button"
        onClick={pasteByLink}
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
      {preview && (
        <button
          type="button"
          onClick={removeImage}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icon name="Trash2" size={15} />
          Удалить фото
        </button>
      )}
    </div>,
    document.body
  ) : null;

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Это не изображение');
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Сессия истекла, войдите заново');
      return;
    }
    setIsUploading(true);
    try {
      console.log('[QuickImage] Сжатие файла', file.name, file.size);
      const compressed = await compressImage(file);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      console.log('[QuickImage] Отправка PUT, base64 длина:', base64.length);
      const res = await fetch(`${RECIPES_API}?id=${recipeId}`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      });
      const data = await res.json();
      console.log('[QuickImage] Ответ:', res.status, data);
      if (res.ok && data.success) {
        setPreview(data.recipe?.image_url || base64);
        onUpdated();
      } else {
        alert(data.error || 'Не удалось загрузить фото');
      }
    } catch (err) {
      console.error('[QuickImage] Ошибка загрузки:', err);
      alert('Ошибка при загрузке фото: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const applyUrl = async (url: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Сессия истекла, войдите заново');
      return;
    }
    setIsUploading(true);
    try {
      console.log('[QuickImage] Импорт по ссылке:', url);
      const res = await fetch(`${RECIPES_API}?id=${recipeId}`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url_import: url }),
      });
      const data = await res.json();
      console.log('[QuickImage] Ответ импорта:', res.status, data);
      if (res.ok && data.success && data.recipe?.image_url) {
        setPreview(data.recipe.image_url);
        setShowUrlInput(false);
        setUrlValue('');
        onUpdated();
      } else {
        alert(data.error || 'Не удалось загрузить фото по ссылке');
      }
    } catch (err) {
      console.error('[QuickImage] Ошибка импорта:', err);
      alert('Ошибка при загрузке по ссылке: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  if (isUploading) {
    return (
      <div className="w-12 h-12 flex items-center justify-center">
        <Icon name="Loader2" size={18} className="animate-spin text-[#748c6d]" />
      </div>
    );
  }

  if (showUrlInput) {
    return (
      <div className="flex flex-col gap-1 w-40" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="border border-border rounded px-1.5 py-1 text-xs w-full"
          placeholder="https://..."
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && urlValue.trim()) applyUrl(urlValue.trim());
            if (e.key === 'Escape') setShowUrlInput(false);
          }}
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => urlValue.trim() && applyUrl(urlValue.trim())}
            className="text-xs px-1.5 py-0.5 bg-[#748c6d] text-white rounded hover:bg-[#5a7052]"
          >OK</button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="text-xs px-1.5 py-0.5 border border-border rounded text-muted-foreground hover:bg-muted"
          >✕</button>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <>
        <div
          className="relative group w-12 h-12 cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onContextMenu={handleContextMenu}
          title="Клик — заменить · ПКМ — меню фото"
        >
          <img src={preview} alt={recipeTitle} className="w-12 h-12 object-cover rounded" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
            <Icon name="ImageUp" size={14} className="text-white" />
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </div>
        {contextMenu}
      </>
    );
  }

  return (
    <>
      <div
        className={`w-12 h-12 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-[#748c6d] bg-[#748c6d]/10' : 'border-gray-300 hover:border-[#748c6d] hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        onContextMenu={handleContextMenu}
        title="Клик — файл · ПКМ — меню фото"
      >
        <Icon name="ImagePlus" size={14} className={isDragging ? 'text-[#748c6d]' : 'text-gray-400'} />
        <button
          type="button"
          className="text-[9px] text-gray-400 hover:text-[#748c6d] leading-tight mt-0.5"
          onClick={(e) => { e.stopPropagation(); setShowUrlInput(true); }}
          title="Вставить по ссылке"
        >
          URL
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      </div>
      {contextMenu}
    </>
  );
}