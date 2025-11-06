
import React from 'react';
import type { ResultRow } from '../types';

interface ResultsTableProps {
    results: ResultRow[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
    return (
        <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                        <th scope="col" className="px-6 py-3">Mã Số Thuế</th>
                        <th scope="col" className="px-6 py-3">Tên Công Ty</th>
                        <th scope="col" className="px-6 py-3">Địa Chỉ</th>
                        <th scope="col" className="px-6 py-3">Trạng Thái</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((row, index) => (
                        <tr key={`${row.taxCode}-${index}`} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{row.taxCode}</td>
                            <td className="px-6 py-4">{row.companyName}</td>
                            <td className="px-6 py-4">{row.address || 'N/A'}</td>
                            <td className={`px-6 py-4 ${row.status.startsWith('❌') ? 'text-red-600' : 'text-green-600'}`}>
                                {row.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
