import { useState } from 'react';

interface SpreadsheetViewerProps {
  content?: string;
  fileName: string;
}

export function SpreadsheetViewer({ content, fileName }: SpreadsheetViewerProps) {
  // Parse CSV content
  const parseCSV = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    return lines.map(line => {
      // Simple CSV parsing (handles basic cases)
      return line.split(',').map(cell => cell.trim());
    });
  };

  const initialData = content ? parseCSV(content) : [];
  const headers = initialData[0] || [];
  const initialRows = initialData.slice(1);

  // State for editable data
  const [rows, setRows] = useState(initialRows);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add empty rows to fill the space (like Excel)
  const emptyRowCount = 50;
  const emptyRows = Array.from({ length: emptyRowCount }, () => Array(headers.length).fill(''));

  // Generate column letters (A, B, C, ...)
  const getColumnLetter = (index: number) => {
    let letter = '';
    let num = index;
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
  };

  const handleCellClick = (rowIndex: number, cellIndex: number, currentValue: string) => {
    setEditingCell({ row: rowIndex, col: cellIndex });
    setEditValue(currentValue);
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const newRows = [...rows];
      newRows[editingCell.row][editingCell.col] = editValue;
      setRows(newRows);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  if (!content || headers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white overflow-auto">
      <table className="border-collapse min-w-full">
        <thead>
          {/* Column headers (A, B, C, ...) */}
          <tr className="h-[28px]">
            <th className="sticky top-0 left-0 z-30 bg-gray-100 border-r border-b border-gray-300 w-12 h-[28px] text-[11px] font-normal text-gray-600"></th>
            {headers.map((_, index) => (
              <th
                key={index}
                className="sticky top-0 z-10 bg-gray-100 border-r border-b border-gray-300 min-w-[140px] h-[28px] px-2 text-[11px] font-normal text-gray-600"
              >
                {getColumnLetter(index)}
              </th>
            ))}
          </tr>
          {/* Data headers */}
          <tr className="h-[36px]">
            <th className="sticky top-[28px] left-0 z-30 bg-gray-100 border-r border-b border-gray-300 w-12 h-[36px] text-[11px] font-normal text-gray-600 text-center">
              1
            </th>
            {headers.map((header, index) => (
              <th
                key={index}
                className="sticky top-[28px] z-10 border-r border-b border-gray-300 px-3 py-2 bg-blue-50 min-w-[140px] h-[36px] text-left"
              >
                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">{header}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="h-[36px]">
              {/* Row number */}
              <td className="sticky left-0 z-20 bg-gray-100 border-r border-b border-gray-300 w-12 h-[36px] text-[11px] font-normal text-gray-600 text-center">
                {rowIndex + 2}
              </td>
              {/* Row data */}
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-r border-b border-gray-300 bg-white min-w-[140px] h-[36px] hover:bg-blue-50 cursor-cell relative"
                  onClick={() => handleCellClick(rowIndex, cellIndex, cell)}
                >
                  {editingCell?.row === rowIndex && editingCell?.col === cellIndex ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full h-full px-3 py-2 text-sm text-gray-900 border-2 border-blue-500 outline-none"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{cell}</div>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {emptyRows.map((row, rowIndex) => (
            <tr key={`empty-${rowIndex}`} className="h-[36px]">
              {/* Row number */}
              <td className="sticky left-0 z-20 bg-gray-100 border-r border-b border-gray-300 w-12 h-[36px] text-[11px] font-normal text-gray-600 text-center">
                {rowIndex + 2 + rows.length}
              </td>
              {/* Row data */}
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-r border-b border-gray-300 bg-white min-w-[140px] h-[36px] hover:bg-blue-50 cursor-cell"
                >
                  <div className="px-3 py-2 text-sm text-gray-900">&nbsp;</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}