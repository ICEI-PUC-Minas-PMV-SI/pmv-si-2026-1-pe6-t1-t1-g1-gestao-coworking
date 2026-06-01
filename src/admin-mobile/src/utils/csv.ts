import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function shareCsv(fileName: string, header: string[], rows: unknown[][]) {
  const content = [header, ...rows].map((row) => row.map(csvValue).join(',')).join('\n');
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, `\uFEFF${content}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: fileName,
      UTI: 'public.comma-separated-values-text',
    });
  }

  return uri;
}
