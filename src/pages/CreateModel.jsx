import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/eda';

export default function CreateModel() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        model_name: '',
        model_type: 'MMM'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/v1/models`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create model');
            }

            const data = await response.json();
            // Store selected model ID if needed or just navigate
            localStorage.setItem('active_model_id', data.model_id);
            navigate('/step/eda-data-hub');
        } catch (err) {
            console.error('Failed to create model:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <PageHeader
                title="Create New Model"
                subtitle="Initialize a new modeling project to start the ETL/EDA process."
                breadcrumb={['Dashboard', 'Create Model']}
            />

            <div className="card mt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Model Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Spring Promo 2026 Analysis"
                            value={formData.model_name}
                            onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Model Type
                        </label>
                        <select
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={formData.model_type}
                            onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
                        >
                            <option value="MMM">Marketing Mix Modeling (MMM)</option>
                            <option value="MTA">Multi-Touch Attribution (MTA)</option>
                            <option value="EDA">Simple EDA</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Model & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
