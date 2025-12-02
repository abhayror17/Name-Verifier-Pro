import * as XLSX from 'xlsx';
import { ProcessedNameEntry, GroundingSource } from '../types';

// Helper to safely access the XLSX library whether it's a default export or named export
const getXLSX = (): typeof XLSX => {
  // @ts-ignore - Handle potential default export from CDN
  return (XLSX as any).default || XLSX;
};

export const downloadAsExcel = (entries: ProcessedNameEntry[]) => {
  const lib = getXLSX();
  
  const data = entries.map(entry => ({
    'Correct Name': entry.correctName,
    'Status': entry.isVerified ? 'Verified' : 'Unverified',
    'Description': entry.description,
    'Original Variations': entry.originalVariations.join(', '),
  }));

  const worksheet = lib.utils.json_to_sheet(data);
  const workbook = lib.utils.book_new();
  lib.utils.book_append_sheet(workbook, worksheet, 'Verified Names');
  
  lib.writeFile(workbook, 'NameVerifier_Results.xlsx');
};

export const downloadAsHtml = (entries: ProcessedNameEntry[], sources: GroundingSource[]) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Name Verification Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .summary { margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f1f5f9; font-weight: 600; color: #475569; }
        tr:hover { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-green { background-color: #dcfce7; color: #166534; }
        .badge-amber { background-color: #fef3c7; color: #92400e; }
        .variations { font-size: 0.9em; color: #64748b; }
        .sources { margin-top: 40px; }
        .source-link { display: block; margin-bottom: 5px; color: #2563eb; text-decoration: none; }
        .source-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Verification Report</h1>
      <div class="summary">
        <p><strong>Total Entities Found:</strong> ${entries.length}</p>
        <p><strong>Verified:</strong> ${entries.filter(e => e.isVerified).length}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Description</th>
            <th>Original Variations</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => `
            <tr>
              <td>${entry.correctName}</td>
              <td>
                <span class="badge ${entry.isVerified ? 'badge-green' : 'badge-amber'}">
                  ${entry.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </td>
              <td>${entry.description || '-'}</td>
              <td class="variations">${entry.originalVariations.join(', ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${sources.length > 0 ? `
        <div class="sources">
          <h2>Verified Sources</h2>
          ${sources.map(s => `<a href="${s.uri}" target="_blank" class="source-link">${s.title} (${s.uri})</a>`).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'NameVerification_Report.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};