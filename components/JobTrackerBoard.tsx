
import React, { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';

interface JobTrackerBoardProps {
    applications: JobApplication[];
    onUpdateApplication: (app: JobApplication) => void;
    onDeleteApplication: (id: string) => void;
    onAddApplication: (app: Omit<JobApplication, 'id' | 'dateAdded' | 'lastUpdated'>) => void;
}

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
    { id: 'BOOKMARKED', label: 'Bookmarked', color: 'border-slate-500' },
    { id: 'APPLYING', label: 'Applying', color: 'border-indigo-500' },
    { id: 'APPLIED', label: 'Applied', color: 'border-blue-500' },
    { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-purple-500' },
    { id: 'OFFER', label: 'Offer', color: 'border-green-500' },
    { id: 'REJECTED', label: 'Rejected', color: 'border-red-500' },
];

export const JobTrackerBoard: React.FC<JobTrackerBoardProps> = ({ 
    applications, 
    onUpdateApplication, 
    onDeleteApplication,
    onAddApplication
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        location: '',
        salary: '',
        status: 'BOOKMARKED' as ApplicationStatus,
        url: '',
        notes: ''
    });

    const resetForm = () => {
        setFormData({
            company: '',
            position: '',
            location: '',
            salary: '',
            status: 'BOOKMARKED',
            url: '',
            notes: ''
        });
        setEditingApp(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingApp) {
            onUpdateApplication({
                ...editingApp,
                ...formData,
                lastUpdated: Date.now()
            });
        } else {
            onAddApplication(formData);
        }
        setIsAddModalOpen(false);
        resetForm();
    };

    const openEdit = (app: JobApplication) => {
        setEditingApp(app);
        setFormData({
            company: app.company,
            position: app.position,
            location: app.location || '',
            salary: app.salary || '',
            status: app.status,
            url: app.url || '',
            notes: app.notes || ''
        });
        setIsAddModalOpen(true);
    };

    const handleStatusChange = (app: JobApplication, newStatus: ApplicationStatus) => {
        onUpdateApplication({ ...app, status: newStatus, lastUpdated: Date.now() });
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200">Job Tracker</h2>
                    <p className="text-sm text-slate-400">Manage your entire search lifecycle in one place.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add Job
                </button>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-6 h-full custom-scrollbar">
                {COLUMNS.map(col => {
                    const colApps = applications.filter(a => a.status === col.id);
                    
                    return (
                        <div key={col.id} className="min-w-[300px] w-[300px] flex flex-col bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <div className={`p-3 border-t-4 ${col.color} bg-slate-800 rounded-t-lg flex justify-between items-center sticky top-0`}>
                                <h3 className="font-bold text-slate-200 uppercase text-sm tracking-wide">{col.label}</h3>
                                <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{colApps.length}</span>
                            </div>
                            
                            <div className="p-3 space-y-3 flex-grow overflow-y-auto max-h-[600px] custom-scrollbar">
                                {colApps.map(app => (
                                    <div key={app.id} className="bg-slate-700 p-4 rounded-md shadow-sm border border-slate-600 hover:border-indigo-500/50 transition-colors group relative">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-md leading-tight">{app.position}</h4>
                                            <button onClick={() => openEdit(app)} className="text-slate-400 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                        </div>
                                        <p className="text-indigo-300 text-sm font-medium mb-2">{app.company}</p>
                                        
                                        {app.location && (
                                            <div className="flex items-center text-xs text-slate-400 mb-1">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                {app.location}
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-slate-600 flex justify-between items-center">
                                            <select 
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                                                className="bg-slate-800 text-xs text-slate-300 border border-slate-600 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-500"
                                            >
                                                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <button onClick={() => onDeleteApplication(app.id)} className="text-slate-500 hover:text-red-400" title="Delete">
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {colApps.length === 0 && (
                                    <div className="text-center py-8 opacity-30 text-sm text-slate-400 border-2 border-dashed border-slate-700 rounded-md">
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700 p-6 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-4">{editingApp ? 'Edit Application' : 'Add New Job'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company</label>
                                <input required type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Job Title</label>
                                <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location</label>
                                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Salary</label>
                                    <input type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. $120k" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL</label>
                                <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ApplicationStatus})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500">
                                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notes</label>
                                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-indigo-500" rows={3}></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">{editingApp ? 'Save Changes' : 'Add Job'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
