import * as XLSX from 'xlsx';

export interface ParsedRecipe {
  title: string;
  servings: string;
  cooking_time: string;
  steps: string;
  ingredients: string;
  categories: string;
  user_groups: string;
  image_url_import: string;
  weight_per_serving: string;
  calories: string;
  protein: string;
  fats: string;
  carbs: string;
  calories_100: string;
  protein_100: string;
  fats_100: string;
  carbs_100: string;
}

export type DuplicateDecision = 'replace' | 'skip' | 'add';

export interface Duplicate {
  id: number;
  title: string;
}

export function parseSteps(raw: string): string {
  if (!raw) return '';
  return raw
    .split(/\d+\)\s*/)
    .map(s => s.trim().replace(/[;.,]+$/, '').trim())
    .filter(Boolean)
    .join('\n');
}

export function normalizeFloat(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function normalizeInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).replace(',', '.');
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

export function findCol(row: Record<string, unknown>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find(k => k.trim().toLowerCase() === c.trim().toLowerCase());
    if (found !== undefined) return String(row[found] ?? '').trim();
  }
  return '';
}

export function parseExcel(buffer: ArrayBuffer): ParsedRecipe[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Читаем все строки как массивы (без авто-заголовков)
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Ищем строку-заголовок — ту, где есть 'title'
  let headerIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i].map(c => String(c ?? '').trim().toLowerCase());
    if (row.includes('title')) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return [];

  const headers = raw[headerIdx].map(c => String(c ?? '').trim());
  const dataRows = raw.slice(headerIdx + 1);

  const getByHeader = (row: unknown[], candidates: string[]): string => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase());
      if (idx !== -1) return String(row[idx] ?? '').trim();
    }
    return '';
  };

  return dataRows
    .map(row => ({
      title: getByHeader(row, ['title']),
      servings: getByHeader(row, ['servings']),
      cooking_time: getByHeader(row, ['time']),
      steps: getByHeader(row, ['steps']),
      ingredients: getByHeader(row, ['ingredients']),
      categories: getByHeader(row, ['categories']),
      user_groups: getByHeader(row, ['user_groups']),
      image_url_import: getByHeader(row, ['image']),
      weight_per_serving: getByHeader(row, ['грамм на 1 п', 'грамм на 1п', 'грамм на 1 порц', 'грамм на 1 порцию']),
      calories: getByHeader(row, ['КБЖУ на 1 п', 'КБЖУ на 1п', 'КБЖУ на 1 порцию']),
      protein: getByHeader(row, ['Б на 1 п', 'Б на 1п', 'Б на 1 порцию']),
      fats: getByHeader(row, ['Ж на 1 п', 'Ж на 1п', 'Ж на 1 порцию']),
      carbs: getByHeader(row, ['У на 1 п', 'У на 1п', 'У на 1 порцию']),
      calories_100: getByHeader(row, ['КБЖУ на 100', 'КГБЖУ на 100', 'КБЖУ на 100 г']),
      protein_100: getByHeader(row, ['Б на 100', 'Б на 100 г']),
      fats_100: getByHeader(row, ['Ж на 100', 'Ж на 100 г']),
      carbs_100: getByHeader(row, ['У на 100', 'У на 100 г']),
    }))
    .filter(r => r.title);
}

// Парсит одну строку CSV с учётом кавычек и переносов внутри полей
export function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// Разбивает весь CSV-текст на строки с учётом переносов внутри кавычек
export function splitCsvRows(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (cur.trim()) rows.push(parseCsvLine(cur, sep));
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(parseCsvLine(cur, sep));
  return rows;
}

export function parseCsv(text: string): ParsedRecipe[] {
  // Автоопределение разделителя по первой строке
  const firstLine = text.split('\n')[0];
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const rows = splitCsvRows(text, sep);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.replace(/^"|"$/g, '').trim());

  const getCol = (row: string[], candidates: string[]) => {
    for (const c of candidates) {
      const idx = header.findIndex(h => h.toLowerCase() === c.toLowerCase());
      if (idx !== -1) return (row[idx] || '').replace(/^"|"$/g, '').trim();
    }
    return '';
  };

  return rows.slice(1).map(row => ({
    title: getCol(row, ['title']),
    servings: getCol(row, ['servings']),
    cooking_time: getCol(row, ['time']),
    steps: getCol(row, ['steps']),
    ingredients: getCol(row, ['ingredients']),
    categories: getCol(row, ['categories']),
    user_groups: getCol(row, ['user_groups']),
    image_url_import: getCol(row, ['image']),
    weight_per_serving: getCol(row, ['грамм на 1 п', 'грамм на 1п', 'грамм на 1 порц', 'грамм на 1 порцию']),
    calories: getCol(row, ['КБЖУ на 1 п', 'КБЖУ на 1п', 'КБЖУ на 1 порцию']),
    protein: getCol(row, ['Б на 1 п', 'Б на 1п', 'Б на 1 порцию']),
    fats: getCol(row, ['Ж на 1 п', 'Ж на 1п', 'Ж на 1 порцию']),
    carbs: getCol(row, ['У на 1 п', 'У на 1п', 'У на 1 порцию']),
    calories_100: getCol(row, ['КБЖУ на 100', 'КГБЖУ на 100', 'КБЖУ на 100 г']),
    protein_100: getCol(row, ['Б на 100', 'Б на 100 г']),
    fats_100: getCol(row, ['Ж на 100', 'Ж на 100 г']),
    carbs_100: getCol(row, ['У на 100', 'У на 100 г']),
  })).filter(r => r.title);
}
