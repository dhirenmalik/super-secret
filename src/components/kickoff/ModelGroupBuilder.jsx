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

    const filteredL2 = useMemo(() => {
        return unassignedL2.filter((value) =>
            value.toLowerCase().includes(search.toLowerCase()),
        )
    }, [unassignedL2, search])

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

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Model Grouping</h2>
                    <p className="text-sm text-slate-500">
                        Drag L2 subcategories into groups and save the mapping.
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
                <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                                Historical Values
                            </p>
                            <span className="text-xs text-slate-400">
                                {historicalGroups.length} groups
                            </span>
                        </div>
                        <div className="mt-4 max-h-[520px] space-y-3 overflow-auto">
                            {historicalGroups.length === 0 && (
                                <p className="text-xs text-slate-400">
                                    No historical grouping loaded.
                                </p>
                            )}
                            {historicalGroups.map((group) => (
                                <div
                                    key={`historical-${group.group_id}-${group.group_name}`}
                                    className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                    <p className="text-xs font-semibold text-slate-700">
                                        {group.group_name}
                                    </p>
                                    <p className="mt-2 text-[11px] text-slate-500">
                                        {group.l2_values?.join(', ') || 'No L2 values'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <DroppableCard id="unassigned">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700">Unassigned L2</p>
                                <span className="text-xs text-slate-400">
                                    {filteredL2.length} items
                                </span>
                            </div>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search L2 values"
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                            />
                            <div className="mt-4 flex max-h-[220px] flex-wrap gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
                                {filteredL2.length === 0 && (
                                    <span className="text-xs text-slate-400">
                                        No unassigned L2.
                                    </span>
                                )}
                                {filteredL2.map((value) => (
                                    <DraggableChip key={value} value={value} />
                                ))}
                            </div>
                        </DroppableCard>

                        <div className="space-y-4">
                            {groups.map((group) => (
                                <DroppableCard key={group.group_id} id={String(group.group_id)}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                                Group {group.group_id}
                                            </p>
                                            <input
                                                value={group.group_name}
                                                onChange={(event) =>
                                                    handleGroupNameChange(group.group_id, event.target.value)
                                                }
                                                placeholder="Group name"
                                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGroup(group.group_id)}
                                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {group.l2_values.length === 0 && (
                                            <span className="text-xs text-slate-400">
                                                No L2 assigned.
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
                                className="w-full rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                            >
                                + Create New Group
                            </button>
                        </div>
                    </div>
                </div>
                <DragOverlay>
                    {activeDrag ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 shadow-lg">
                            {activeDrag}
                        </span>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </section>
    )
}

export default ModelGroupBuilder
