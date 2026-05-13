import { useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

interface ImageDropzoneProps {
  imagePreview: string | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export default function ImageDropzone({ imagePreview, onFileSelected, onClear }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    onFileSelected(file);
  }, [onFileSelected]);

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

  if (imagePreview) {
    return (
      <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-border">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 bg-white text-black text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Icon name="RefreshCw" size={14} />
            Заменить
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
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
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
      <Icon
        name="ImageUp"
        size={32}
        className={isDragging ? 'text-[#748c6d]' : 'text-muted-foreground'}
      />
      <p className="text-sm text-muted-foreground text-center">
        {isDragging
          ? 'Отпустите, чтобы загрузить'
          : 'Перетащите фото сюда или нажмите для выбора'}
      </p>
      <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · до 5 МБ</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
