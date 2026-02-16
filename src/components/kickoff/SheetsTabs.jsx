import React from 'react'

const SheetsTabs = ({ tabs, activeId, onChange }) => {
    return (
        <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto pb-3">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeId
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`whitespace-nowrap rounded-t-2xl px-4 py-2 text-sm font-semibold transition ${isActive
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default SheetsTabs
