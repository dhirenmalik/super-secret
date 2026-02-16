import React from 'react'

const UploadSidebar = ({
    selectedFile,
    isUploading,
    onFileChange,
    onUpload,
    error,
    preview,
    isUploadOpen,
    onToggleUpload,
    isPreviewOpen,
    onTogglePreview,
}) => {
    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-700">CSV Upload</p>
                        <p className="text-xs text-slate-500">
                            Accepted format: .csv • Max 10MB
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleUpload}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                        {isUploadOpen ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {isUploadOpen && (
                    <div className="mt-6 flex flex-col gap-3">
                        <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={onFileChange}
                            />
                            {selectedFile ? selectedFile.name : 'Choose file'}
                        </label>
                        <button
                            type="button"
                            onClick={onUpload}
                            disabled={isUploading}
                            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {isUploading ? 'Uploading…' : 'Upload & Preview'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </section>

            {preview && (
                <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Preview (first {preview.row_count_returned} rows)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Columns detected: {preview.columns.length}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onTogglePreview}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                            {isPreviewOpen ? 'Collapse' : 'Expand'}
                        </button>
                    </div>

                    {isPreviewOpen && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="max-h-[360px] overflow-auto">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
                                        <tr>
                                            {preview.columns.map((column) => (
                                                <th key={column} className="px-3 py-2 font-medium">
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preview.rows.map((row, rowIndex) => (
                                            <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                                                {preview.columns.map((column) => (
                                                    <td key={column} className="px-3 py-2 text-slate-600">
                                                        {row[column] ?? ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

export default UploadSidebar
