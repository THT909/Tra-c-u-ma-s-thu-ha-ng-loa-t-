import React, { useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { StatusDisplay } from './components/StatusDisplay';
import { ResultsTable } from './components/ResultsTable';
import { ProcessButton } from './components/ProcessButton';
import { ExportButton } from './components/ExportButton';
import { TemplateButton } from './components/TemplateButton';
import { StopOnErrorSwitch } from './components/StopOnErrorSwitch';
import type { ResultRow, StatusInfo } from './types';

// Make XLSX available from the global scope (loaded via CDN in index.html)
declare const XLSX: any;

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [results, setResults] = useState<ResultRow[]>([]);
    const [statusInfo, setStatusInfo] = useState<StatusInfo>({
        message: 'Vui lòng chọn một file Excel để bắt đầu.',
        progress: 0,
        successCount: 0,
        errorCount: 0,
        total: 0,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [stopOnError, setStopOnError] = useState<boolean>(false);
    const processingRef = useRef<boolean>(false);

    const resetState = () => {
        setResults([]);
        setStatusInfo({
            message: 'Vui lòng chọn một file Excel để bắt đầu.',
            progress: 0,
            successCount: 0,
            errorCount: 0,
            total: 0,
        });
        setIsLoading(false);
        processingRef.current = false;
    };

    const handleFileChange = (selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile) {
            resetState();
            setStatusInfo(prev => ({ ...prev, message: `File đã chọn: ${selectedFile.name}` }));
        }
    };

    const processFile = useCallback(async () => {
        if (!file || processingRef.current) return;

        setIsLoading(true);
        processingRef.current = true;
        setResults([]);

        setStatusInfo({
            message: '🔄 Đang đọc file Excel...',
            progress: 0,
            successCount: 0,
            errorCount: 0,
            total: 0,
        });

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            if (!e.target?.result) {
                setStatusInfo(prev => ({ ...prev, message: '❌ Lỗi đọc file.' }));
                setIsLoading(false);
                processingRef.current = false;
                return;
            }

            try {
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (rows.length === 0 || !('MST' in rows[0])) {
                    setStatusInfo(prev => ({ ...prev, message: "❌ Không tìm thấy cột 'MST' hoặc file trống." }));
                    setIsLoading(false);
                    processingRef.current = false;
                    return;
                }

                let currentSuccessCount = 0;
                let currentErrorCount = 0;
                const newResults: ResultRow[] = [];
                const totalRows = rows.length;
                let stoppedOnError = false;
                setStatusInfo(prev => ({ ...prev, total: totalRows }));

                for (let i = 0; i < totalRows; i++) {
                    const row = rows[i];
                    const taxCode = row['MST']?.toString().trim();

                    setStatusInfo(prev => ({
                        ...prev,
                        message: `🔎 [${i + 1}/${totalRows}] Tra cứu MST: ${taxCode || '(trống)'}...`,
                        progress: ((i + 1) / totalRows) * 100
                    }));

                    if (!taxCode) {
                        currentErrorCount++;
                        newResults.push({
                            taxCode: '(trống)',
                            companyName: 'Không có MST',
                            status: '❌ Bỏ qua',
                        });
                        setResults([...newResults]);
                        setStatusInfo(prev => ({ ...prev, errorCount: currentErrorCount }));
                        
                        if (stopOnError) {
                            stoppedOnError = true;
                             setStatusInfo(prev => ({
                                ...prev,
                                message: `⚠️ Đã dừng do dòng ${i + 2} không có MST.`,
                            }));
                            break;
                        }
                        continue;
                    }
                    
                    let errorOccurred = false;

                    try {
                        const res = await fetch(`https://api.vietqr.io/v2/business/${taxCode}`);
                        const json = await res.json();

                        if (json.code === '00') {
                            currentSuccessCount++;
                            const d = json.data;
                            newResults.push({
                                taxCode: d.id,
                                companyName: d.name,
                                address: d.address,
                                status: d.status,
                            });
                        } else {
                            errorOccurred = true;
                            currentErrorCount++;
                            newResults.push({
                                taxCode: taxCode,
                                companyName: 'Không tìm thấy',
                                status: `❌ ${json.desc || 'Lỗi không xác định'}`,
                            });
                        }
                    } catch (err: any) {
                        errorOccurred = true;
                        currentErrorCount++;
                        newResults.push({
                            taxCode: taxCode,
                            companyName: 'Lỗi',
                            status: `❌ Lỗi mạng: ${err.message}`,
                        });
                    }

                    setResults([...newResults]);
                    setStatusInfo(prev => ({
                        ...prev,
                        successCount: currentSuccessCount,
                        errorCount: currentErrorCount,
                    }));

                    if (errorOccurred && stopOnError) {
                        stoppedOnError = true;
                        setStatusInfo(prev => ({
                            ...prev,
                            message: `⚠️ Đã dừng do lỗi ở MST: ${taxCode}.`
                        }));
                        break;
                    }
                    
                    // Delay to avoid API rate limiting
                    if (i < totalRows - 1) {
                       await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                }
                
                if (!stoppedOnError) {
                    setStatusInfo(prev => ({
                        ...prev,
                        message: `✅ Hoàn thành: ${currentSuccessCount} thành công, ${currentErrorCount} lỗi.`
                    }));
                }

            } catch (err: any) {
                setStatusInfo(prev => ({ ...prev, message: `❌ Lỗi xử lý file Excel: ${err.message}` }));
            } finally {
                setIsLoading(false);
                processingRef.current = false;
            }
        };

        reader.readAsArrayBuffer(file);
    }, [file, stopOnError]);

    const exportToExcel = useCallback(() => {
        if (results.length === 0) {
            setStatusInfo(prev => ({ ...prev, message: "ℹ️ Không có dữ liệu để xuất." }));
            return;
        }

        try {
            setStatusInfo(prev => ({ ...prev, message: "📤 Đang tạo file Excel..." }));
            const worksheet = XLSX.utils.json_to_sheet(results);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaTraCuu');

            // Auto-fit columns
            const cols = Object.keys(results[0]).map(key => ({
              wch: Math.max(
                key.length,
                ...results.map(row => (row[key as keyof ResultRow] || '').toString().length)
              ) + 2 // add padding
            }));
            worksheet['!cols'] = cols;

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ket_qua_tra_cuu_mst.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setStatusInfo(prev => ({ ...prev, message: "✅ File Excel đã được tải xuống." }));
        } catch (e: any) {
            setStatusInfo(prev => ({ ...prev, message: `❌ Lỗi khi xuất Excel: ${e.message}` }));
        }
    }, [results]);

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Công cụ Tra cứu Mã Số Thuế</h1>
                    <p className="text-slate-600 mt-2">Tải lên file Excel chứa cột 'MST' để tra cứu thông tin doanh nghiệp hàng loạt.</p>
                </header>

                <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
                    <FileUpload onFileChange={handleFileChange} disabled={isLoading} />
                    
                    <div className="flex items-center justify-center pt-2">
                         <StopOnErrorSwitch 
                            checked={stopOnError}
                            onChange={setStopOnError}
                            disabled={isLoading}
                         />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
                        <TemplateButton disabled={isLoading} />
                        <ProcessButton onClick={processFile} disabled={!file || isLoading} isLoading={isLoading} />
                        <ExportButton onClick={exportToExcel} disabled={results.length === 0 || isLoading} />
                    </div>

                    <StatusDisplay statusInfo={statusInfo} />
                    
                    {results.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-4 text-slate-700">Kết quả xem trước</h2>
                            <ResultsTable results={results} />
                        </div>
                    )}
                </main>

                <footer className="text-center mt-8 text-sm text-slate-500">
                    <p>Cung cấp bởi API của <a href="https://vietqr.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">VietQR.io</a></p>
                    <p>&copy; {new Date().getFullYear()} - Xây dựng với React & Tailwind CSS</p>
                </footer>
            </div>
        </div>
    );
};

export default App;