import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/kickoff';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, Edit2, Check, X, ShieldAlert, Tag } from 'lucide-react';

export default function ExcludeFlagConfig() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('private-brands');

    // Data states
    const [privateBrands, setPrivateBrands] = useState([]);
    const [mappingIssues, setMappingIssues] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [newBrandName, setNewBrandName] = useState('');
    const [newIssueDesc, setNewIssueDesc] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'private-brands' ? '/api/v1/private-brands' : '/api/v1/mapping-issues';
            const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();

            if (activeTab === 'private-brands') {
                setPrivateBrands(data);
            } else {
                setMappingIssues(data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        try {
            const endpoint = activeTab === 'private-brands' ? '/api/v1/private-brands' : '/api/v1/mapping-issues';
            const payload = activeTab === 'private-brands'
                ? { brand_name: newBrandName.trim() }
                : { brand_name: newBrandName.trim(), issue_description: newIssueDesc.trim() };

            const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to add record');
            }

            setNewBrandName('');
            setNewIssueDesc('');
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this record?")) return;

        try {
            const endpoint = activeTab === 'private-brands' ? `/api/v1/private-brands/${id}` : `/api/v1/mapping-issues/${id}`;
            const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete record');
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    // Filter logic
    const filteredPB = privateBrands.filter(pb => pb.brand_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredMI = mappingIssues.filter(mi => mi.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) || (mi.issue_description || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="card shadow-sm hover:shadow-md transition-shadow mt-6"
        >
            <div className="card-header border-b border-slate-100 bg-white rounded-t-xl px-6 py-5 flex items-center justify-between">
                <div className="card-title text-indigo-900 m-0 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shadow-sm border border-emerald-100">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    Global Exclusion Rules
                </div>

                <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setActiveTab('private-brands'); setSearchTerm(''); }}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'private-brands' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Private Brands
                    </button>
                    <button
                        onClick={() => { setActiveTab('mapping-issues'); setSearchTerm(''); }}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'mapping-issues' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Mapping Issues
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
                        />
                    </div>

                    <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Brand Name"
                            required
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:w-48 outline-none focus:border-indigo-400"
                        />
                        {activeTab === 'mapping-issues' && (
                            <input
                                type="text"
                                placeholder="Issue Reason (Optional)"
                                value={newIssueDesc}
                                onChange={(e) => setNewIssueDesc(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:w-64 outline-none focus:border-indigo-400"
                            />
                        )}
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </button>
                    </form>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden h-[400px] flex flex-col">
                    <div className="overflow-y-auto flex-1 bg-slate-50/50">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <div className="skeleton-shimmer w-full h-full"></div>
                                <span className="absolute">Loading rules...</span>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Brand Name</th>
                                        {activeTab === 'mapping-issues' && (
                                            <th className="px-6 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Description</th>
                                        )}
                                        <th className="px-6 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 w-24 text-center">Status</th>
                                        <th className="px-6 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 w-24 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {activeTab === 'private-brands' ? (
                                        filteredPB.length > 0 ? filteredPB.map(pb => (
                                            <tr key={pb.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 font-semibold text-slate-700 text-sm flex items-center gap-2">
                                                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                                                    {pb.brand_name}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pb.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {pb.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => handleDelete(pb.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500 text-sm italic">No private brands found.</td></tr>
                                        )
                                    ) : (
                                        filteredMI.length > 0 ? filteredMI.map(mi => (
                                            <tr key={mi.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 font-semibold text-slate-700 text-sm">{mi.brand_name}</td>
                                                <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-xs">{mi.issue_description || '-'}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${mi.is_active ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {mi.is_active ? 'Flagged' : 'Resolved'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button onClick={() => handleDelete(mi.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm italic">No mapping issues found.</td></tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
