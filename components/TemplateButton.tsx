import React from 'react';

// Make XLSX available from the global scope
declare const XLSX: any;

interface TemplateButtonProps {
    disabled: boolean;
}

export const TemplateButton: React.FC<TemplateButtonProps> = ({ disabled }) => {
    const downloadTemplate = () => {
        // 1. Create template data
        const templateData = [
            { 'MST': '0300588569' }, // Example 1
            { 'MST': '0100109106' }, // Example 2
            { 'MST': '0100112158' }, // Example 3
        ];

        // 2. Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        // Optional: Set column width
        worksheet['!cols'] = [{ wch: 20 }]; // Set width for the MST column

        // 3. Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // 4. Create Blob and trigger download
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'mau_tra_cuu_mst.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={downloadTemplate}
            disabled={disabled}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ml-1 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Tải file mẫu
        </button>
    );
};