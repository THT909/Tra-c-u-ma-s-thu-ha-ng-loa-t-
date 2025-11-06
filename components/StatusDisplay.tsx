
import React from 'react';
import type { StatusInfo } from '../types';

interface StatusDisplayProps {
    statusInfo: StatusInfo;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ statusInfo }) => {
    const { message, progress, successCount, errorCount, total } = statusInfo;
    const isProcessing = progress > 0 && progress < 100;
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
                <p className="text-slate-700">{message}</p>
                {total > 0 && <span className="text-slate-500">{Math.round(successCount + errorCount)} / {total}</span>}
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {total > 0 && (
                <div className="flex justify-between text-xs pt-1">
                    <span className="font-semibold text-green-600">Thành công: {successCount}</span>
                    <span className="font-semibold text-red-600">Lỗi: {errorCount}</span>
                </div>
            )}
        </div>
    );
};
