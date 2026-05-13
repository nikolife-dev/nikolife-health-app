import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../../backend/func2url.json';

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

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер изображения не должен превышать 5 МБ');
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?id=${recipeId}`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': token!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreview(data.recipe?.image_url || base64);
        onUpdated();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const applyUrl = async (url: string) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${RECIPES_API}?id=${recipeId}`, {
        method: 'PUT',
        headers: { 'X-Auth-Token': token!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreview(url);
        setShowUrlInput(false);
        setUrlValue('');
        onUpdated();
      }
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
      <div
        className="relative group w-12 h-12 cursor-pointer"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        title="Перетащите или кликните для замены фото"
      >
        <img src={preview} alt={recipeTitle} className="w-12 h-12 object-cover rounded" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
          <Icon name="ImageUp" size={14} className="text-white" />
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      </div>
    );
  }

  return (
    <div
      className={`w-12 h-12 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isDragging ? 'border-[#748c6d] bg-[#748c6d]/10' : 'border-gray-300 hover:border-[#748c6d] hover:bg-muted/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
      title="Перетащите фото или кликните"
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
  );
}
