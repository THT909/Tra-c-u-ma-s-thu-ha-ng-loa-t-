import React from 'react';

interface StopOnErrorSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled: boolean;
}

export const StopOnErrorSwitch: React.FC<StopOnErrorSwitchProps> = ({ checked, onChange, disabled }) => {
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <div className="flex items-center justify-center">
            <label htmlFor="stop-on-error-toggle" className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <div className="relative">
                    <input
                        type="checkbox"
                        id="stop-on-error-toggle"
                        className="sr-only"
                        checked={checked}
                        onChange={handleToggle}
                        disabled={disabled}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className={`ml-3 font-medium ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
                    Dừng lại khi gặp lỗi
                </div>
            </label>
        </div>
    );
};