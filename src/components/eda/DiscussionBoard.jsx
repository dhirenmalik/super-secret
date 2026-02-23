import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchComments, addComment } from '../../api/kickoff';

export default function DiscussionBoard({ fileId }) {
    const { token } = useAuth();
    const [comments, setComments] = useState([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadComments = async (id) => {
        if (!id) return;
        setIsCommentsLoading(true);
        try {
            const data = await fetchComments(id, token);
            setComments(data || []);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!fileId || !newComment.trim()) return;
        setIsSubmitting(true);
        try {
            await addComment(fileId, newComment, token);
            setNewComment('');
            await loadComments(fileId);
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        loadComments(fileId);
    }, [fileId]);

    // If no file is selected, don't show the board
    if (!fileId) return null;

    return (
        <div className="card p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Review Discussion</h3>
                <div className="text-sm text-slate-500">
                    {comments.length} message{comments.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="space-y-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your reply or requested change..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm bg-slate-50/30 min-h-[120px] resize-none"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </button>
                </div>
            </div>

            <div className="space-y-6 pt-4 border-l-2 border-slate-100 pl-8 ml-4">
                {isCommentsLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic text-sm">
                        No discussion started yet.
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.comment_id} className="relative">
                            <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm shadow-blue-200"></div>
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2 hover:border-slate-200 transition">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900">{comment.user_name}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {comment.comment_text}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
