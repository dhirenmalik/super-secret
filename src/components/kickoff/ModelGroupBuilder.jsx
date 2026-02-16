import React, { useMemo, useState } from 'react'
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
    DragOverlay,
} from '@dnd-kit/core'

const DroppableCard = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id })
    return (
        <div
            ref={setNodeRef}
            className={`rounded-2xl border ${isOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'
                } p-4`}
        >
            {children}
        </div>
    )
}

const DraggableChip = ({ value, showRemove, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: value, data: { value } })
    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined
    return (
        <span
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 ${isDragging ? 'bg-slate-200/80' : 'bg-slate-50'
                }`}
        >
            {value}
            {showRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-slate-400 hover:text-slate-600"
                >
                    ×
                </button>
            )}
        </span>
    )
}

const ModelGroupBuilder = ({
    l2Values,
    groups,
    historicalGroups = [],
    onGroupsChange,
    onSave,
    isSaving,
    isDirty,
    saveMessage,
}) => {
    const [search, setSearch] = useState('')
    const [activeDrag, setActiveDrag] = useState(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const assignedL2 = useMemo(() => {
        const set = new Set()
        groups.forEach((group) => {
            group.l2_values.forEach((value) => set.add(value))
        })
        return set
    }, [groups])

    const unassignedL2 = useMemo(() => {
        return l2Values.filter((value) => !assignedL2.has(value))
    }, [l2Values, assignedL2])

    const [visibleCount, setVisibleCount] = useState(50)

    const filteredL2 = useMemo(() => {
        return unassignedL2
            .filter((value) =>
                value.toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, visibleCount)
    }, [unassignedL2, search, visibleCount])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    )

    const handleRemoveL2 = (groupId, value) => {
        const updated = groups.map((group) => {
            if (group.group_id !== groupId) {
                return group
            }
            return {
                ...group,
                l2_values: group.l2_values.filter((item) => item !== value),
            }
        })
        onGroupsChange(updated)
    }

    const handleGroupNameChange = (groupId, name) => {
        const updated = groups.map((group) =>
            group.group_id === groupId ? { ...group, group_name: name } : group,
        )
        onGroupsChange(updated)
    }

    const handleDeleteGroup = (groupId) => {
        const updated = groups.filter((group) => group.group_id !== groupId)
        onGroupsChange(updated)
    }

    const moveL2ToGroup = (value, targetId) => {
        const updated = groups.map((group) => ({
            ...group,
            l2_values: group.l2_values.filter((item) => item !== value),
        }))

        if (targetId === 'unassigned') {
            onGroupsChange(updated)
            return
        }

        const targetIndex = updated.findIndex(
            (group) => String(group.group_id) === String(targetId),
        )
        if (targetIndex >= 0) {
            const target = updated[targetIndex]
            updated[targetIndex] = {
                ...target,
                l2_values: Array.from(new Set([...target.l2_values, value])),
            }
        }
        onGroupsChange(updated)
    }

    const handleDragStart = (event) => {
        const value = event.active?.data?.current?.value
        if (value) {
            setActiveDrag(value)
        }
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveDrag(null)
        if (!over) {
            return
        }
        const l2Value = active.data.current?.value
        if (!l2Value) {
            return
        }
        moveL2ToGroup(l2Value, over.id)
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                            </svg>
                        </button>
                        <h2 className="text-xl font-semibold text-slate-900">Model Grouping</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 pl-12">
                        Drag L2 subcategories from the sidebar into groups.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!isDirty || isSaving}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isSaving ? 'Saving…' : 'Save Mapping'}
                    </button>
                    {saveMessage && (
                        <span className="text-xs font-medium text-emerald-600">
                            {saveMessage}
                        </span>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Sidebar */}
                    <div
                        className={`flex flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0'
                            }`}
                    >
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-[320px]">
                            {/* Unassigned L2s Section */}
                            <DroppableCard id="unassigned">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">Unassigned L2</p>
                                    <span className="text-xs text-slate-400">
                                        {filteredL2.length} items
                                    </span>
                                </div>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search L2..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        Limit: {visibleCount}
                                    </span>
                                    <input
                                        type="range"
                                        min="10"
                                        max={Math.max(500, unassignedL2.length)}
                                        step="10"
                                        value={visibleCount}
                                        onChange={(e) => setVisibleCount(parseInt(e.target.value))}
                                        className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        {unassignedL2.length} Total
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {filteredL2.length === 0 && (
                                        <span className="text-xs text-slate-400 w-full text-center py-4">
                                            No matches found.
                                        </span>
                                    )}
                                    {filteredL2.map((value) => (
                                        <DraggableChip key={value} value={value} />
                                    ))}
                                </div>
                            </DroppableCard>

                            {/* Historical Values Section */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Historical Groups
                                    </p>
                                    <span className="text-xs text-slate-400">
                                        {historicalGroups.length}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {historicalGroups.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-2">
                                            No historical data.
                                        </p>
                                    )}
                                    {historicalGroups.map((group) => (
                                        <div
                                            key={`historical-${group.group_id}-${group.group_name}`}
                                            className="p-2 rounded-lg bg-slate-50 border border-slate-100"
                                        >
                                            <p className="text-xs font-semibold text-slate-700 mb-1">
                                                {group.group_name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                {group.l2_values?.join(', ') || 'Empty'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        <div className="max-w-5xl mx-auto space-y-4">
                            {groups.map((group) => (
                                <DroppableCard key={group.group_id} id={String(group.group_id)}>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Group {group.group_id}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteGroup(group.group_id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    title="Delete Group"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                            <input
                                                value={group.group_name}
                                                onChange={(event) =>
                                                    handleGroupNameChange(group.group_id, event.target.value)
                                                }
                                                placeholder="Enter group name..."
                                                className="w-full text-lg font-medium bg-transparent border-none focus:ring-0 p-0 placeholder-slate-300 text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="min-h-[60px] p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-wrap gap-2 transition-colors hover:bg-slate-50">
                                        {group.l2_values.length === 0 && (
                                            <span className="text-sm text-slate-400 italic self-center w-full text-center">
                                                Drag L2 items here from sidebar
                                            </span>
                                        )}
                                        {group.l2_values.map((value) => (
                                            <DraggableChip
                                                key={value}
                                                value={value}
                                                showRemove
                                                onRemove={() => handleRemoveL2(group.group_id, value)}
                                            />
                                        ))}
                                    </div>
                                </DroppableCard>
                            ))}

                            <button
                                type="button"
                                onClick={() => {
                                    const maxId = groups.reduce(
                                        (acc, group) => Math.max(acc, group.group_id),
                                        0,
                                    )
                                    onGroupsChange([
                                        ...groups,
                                        { group_id: maxId + 1, group_name: '', l2_values: [] },
                                    ])
                                }}
                                className="w-full rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-sm font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
                            >
                                + Create New Group
                            </button>

                            {/* Empty state helper */}
                            {groups.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <p className="text-lg mb-2">No groups created yet</p>
                                    <p className="text-sm">Click the button above to start grouping L2 subcategories.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DragOverlay>
                    {activeDrag ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 shadow-lg cursor-grabbing">
                            {activeDrag}
                        </span>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </section>
    )
}

export default ModelGroupBuilder
