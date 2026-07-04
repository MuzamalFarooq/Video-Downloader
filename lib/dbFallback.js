import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'history.json');

function initStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function readHistory() {
  try {
    initStore();
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading fallback DB:', error);
    return [];
  }
}

export async function writeHistory(data) {
  try {
    initStore();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing fallback DB:', error);
    return false;
  }
}
