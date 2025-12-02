import * as XLSX from 'xlsx';

// Helper to safely access the XLSX library whether it's a default export or named export
const getXLSX = (): typeof XLSX => {
  // @ts-ignore - Handle potential default export from CDN
  return (XLSX as any).default || XLSX;
};

export const parseFile = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const lib = getXLSX();
        const data = e.target?.result;
        const workbook = lib.read(data, { type: 'binary' });
        
        // Assume data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays
        const rows = lib.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        
        // Flatten and clean
        const names: string[] = [];
        
        rows.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              if (cell && typeof cell === 'string' && cell.trim().length > 0) {
                names.push(cell.trim());
              }
            });
          }
        });

        // Unique set locally first to reduce obvious duplicates before AI processing
        const uniqueNames = Array.from(new Set(names));
        resolve(uniqueNames);
      } catch (error) {
        console.error("Excel Parsing Error:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);

    // Read as binary string
    reader.readAsBinaryString(file);
  });
};