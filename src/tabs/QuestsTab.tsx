import { ReactElement, useState, useMemo } from "react";
import { Quest, Objective } from "../Stage";

interface QuestsTabProps {
    quests: Quest[];
    addQuest: () => void;
    removeQuest: (id: string) => void;
    updateQuest: (id: string, field: keyof Quest, value: any) => void;
    estimateTokens: (text: string) => number;
    copyToClipboard: (text: string) => void;
    generateId: () => string;
}

export function QuestsTab({
    quests,
    addQuest,
    removeQuest,
    updateQuest,
    estimateTokens,
    copyToClipboard,
    generateId
}: QuestsTabProps): ReactElement {

    // Sorting state
    const [sortOrder, setSortOrder] = useState<'default' | 'name-asc' | 'name-desc' | 'status-active' | 'status-complete'>('default');

    // Sort quests
    const sortedQuests = useMemo(() => {
        if (sortOrder === 'default') {
            return quests;
        }
        
        const sorted = [...quests].sort((a, b) => {
            if (sortOrder === 'name-asc' || sortOrder === 'name-desc') {
                const nameA = a.name.toLowerCase().trim() || 'zzz';
                const nameB = b.name.toLowerCase().trim() || 'zzz';
                return sortOrder === 'name-asc' 
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
            
            // Sort by status
            const statusOrder = {
                'active': 1,
                'complete': 2,
                'failed': 3
            };
            
            if (sortOrder === 'status-active') {
                return statusOrder[a.status] - statusOrder[b.status];
            } else { // status-complete
                return statusOrder[b.status] - statusOrder[a.status];
            }
        });
        
        return sorted;
    }, [quests, sortOrder]);

    // Toggle quest collapse
    const toggleQuestCollapse = (id: string) => {
        const quest = quests.find(q => q.id === id);
        if (quest) {
            updateQuest(id, 'isCollapsed', !quest.isCollapsed);
        }
    };

    // Toggle quest active state
    const toggleQuestActive = (id: string) => {
        const quest = quests.find(q => q.id === id);
        if (quest) {
            updateQuest(id, 'isActive', !quest.isActive);
        }
    };

    // Toggle quest debug
    const toggleQuestDebug = (id: string) => {
        const quest = quests.find(q => q.id === id);
        if (quest) {
            updateQuest(id, 'showDebug', !quest.showDebug);
        }
    };

    // Add objective to quest
    const addObjective = (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const newObjectives = [...quest.objectives, { id: generateId(), label: '', isComplete: false }];
            updateQuest(questId, 'objectives', newObjectives);
        }
    };

    // Update objective
    const updateObjective = (questId: string, objectiveId: string, field: keyof Objective, value: any) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const newObjectives = quest.objectives.map(obj => 
                obj.id === objectiveId ? { ...obj, [field]: value } : obj
            );
            updateQuest(questId, 'objectives', newObjectives);
        }
    };

    // Toggle objective complete
    const toggleObjective = (questId: string, objectiveId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const objective = quest.objectives.find(obj => obj.id === objectiveId);
            if (objective) {
                updateObjective(questId, objectiveId, 'isComplete', !objective.isComplete);
            }
        }
    };

    // Remove objective
    const removeObjective = (questId: string, objectiveId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            const newObjectives = quest.objectives.filter(obj => obj.id !== objectiveId);
            updateQuest(questId, 'objectives', newObjectives);
        }
    };

    // Generate injection preview for quest
    const getQuestInjectionPreview = (quest: Quest): string => {
        if (!quest.nextGoal.trim()) return '[No directive - quest will not be injected]';
        return `[PARTY TRACKER - QUESTS: Steer the conversation toward ${quest.nextGoal.trim()}]`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Action Bar - Add + Sort */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                    onClick={addQuest}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#2a5a2a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#357535'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a5a2a'}
                >
                    + Add Quest
                </button>
                
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    style={{
                        padding: '12px',
                        backgroundColor: '#2a3a5a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        minWidth: '140px'
                    }}
                >
                    <option value="default">⚡ Added</option>
                    <option value="name-asc">🔤 Name (A→Z)</option>
                    <option value="name-desc">🔤 Name (Z→A)</option>
                    <option value="status-active">🏁 Active First</option>
                    <option value="status-complete">✅ Complete First</option>
                </select>
            </div>

            {quests.length === 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: '#666',
                    fontStyle: 'italic'
                }}>
                    No quests yet. Click "Add Quest" to start tracking your narrative goals!
                </div>
            )}

            {/* Quest Cards */}
            {sortedQuests.map(quest => (
                <div
                    key={quest.id}
                    style={{
                        backgroundColor: '#252525',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        padding: '12px'
                    }}
                >
                    {/* Header Row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: quest.isCollapsed ? '0' : '12px',
                        opacity: quest.isActive ? 1 : 0.5
                    }}>
                        <button
                            onClick={() => toggleQuestCollapse(quest.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px'
                            }}
                        >
                            {quest.isCollapsed ? '▶' : '▼'}
                        </button>
                        <input
                            type="text"
                            value={quest.name}
                            onChange={(e) => updateQuest(quest.id, 'name', e.target.value)}
                            placeholder="Quest Name (e.g., Rescue the Princess)"
                            style={{
                                flex: 1,
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                color: '#fff',
                                fontSize: '15px',
                                fontWeight: 600
                            }}
                        />
                        <button
                            onClick={() => toggleQuestActive(quest.id)}
                            title={quest.isActive ? "Quest is active (will steer narrative)" : "Quest is inactive (will NOT steer narrative)"}
                            style={{
                                backgroundColor: 'transparent',
                                color: quest.isActive ? '#ffd700' : '#555',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '20px',
                                padding: '4px 8px',
                                transition: 'transform 0.1s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {quest.isActive ? '⭐' : '☆'}
                        </button>
                        <button
                            onClick={() => removeQuest(quest.id)}
                            style={{
                                backgroundColor: '#5a2a2a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#753535'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#5a2a2a'}
                        >
                            Delete
                        </button>
                    </div>

                    {/* Expanded Content */}
                    {!quest.isCollapsed && (
                        <div style={{ paddingLeft: '32px' }}>
                            {/* Status Dropdown */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#aaa',
                                    marginBottom: '4px',
                                    fontWeight: 600
                                }}>
                                    Status:
                                </label>
                                <select
                                    value={quest.status}
                                    onChange={(e) => updateQuest(quest.id, 'status', e.target.value as 'active' | 'complete' | 'failed')}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="complete">Complete</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            {/* Next Goal (AI Directive) - CRITICAL FIELD */}
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                border: '2px solid #5a7a2a',
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '12px'
                            }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#8ab84a',
                                    marginBottom: '4px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    🎯 Next Goal (AI Directive)
                                </label>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#888',
                                    marginBottom: '8px',
                                    fontStyle: 'italic'
                                }}>
                                    This tells the AI what should happen next. Be specific!
                                </div>
                                <textarea
                                    value={quest.nextGoal}
                                    onChange={(e) => updateQuest(quest.id, 'nextGoal', e.target.value)}
                                    placeholder="e.g., 'find the princess's location in the castle dungeons'"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#252525',
                                        border: '1px solid #5a7a2a',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        color: '#e0e0e0',
                                        fontSize: '13px',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Objectives Section */}
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#aaa',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    ✓ Objectives (Your Tracking)
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    marginBottom: '12px',
                                    fontStyle: 'italic'
                                }}>
                                    Track your progress - NOT sent to AI
                                </div>

                                {quest.objectives.map((objective) => (
                                    <div
                                        key={objective.id}
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginBottom: '6px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={objective.isComplete}
                                            onChange={() => toggleObjective(quest.id, objective.id)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                accentColor: '#4a7a4a',
                                                flexShrink: 0
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={objective.label}
                                            onChange={(e) => updateObjective(quest.id, objective.id, 'label', e.target.value)}
                                            placeholder="Objective description..."
                                            style={{
                                                flex: 1,
                                                backgroundColor: '#252525',
                                                border: '1px solid #444',
                                                borderRadius: '4px',
                                                padding: '6px 8px',
                                                color: objective.isComplete ? '#888' : '#fff',
                                                fontSize: '13px',
                                                textDecoration: objective.isComplete ? 'line-through' : 'none'
                                            }}
                                        />
                                        <button
                                            onClick={() => removeObjective(quest.id, objective.id)}
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: '#999',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                padding: '4px 8px'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.color = '#ff6666'}
                                            onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addObjective(quest.id)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: '#2a3a5a',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginTop: '8px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                                >
                                    + Add Objective
                                </button>
                            </div>

                            {/* Notes Section */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#aaa',
                                    marginBottom: '4px',
                                    fontWeight: 600
                                }}>
                                    📝 Notes (Private)
                                </label>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    marginBottom: '8px',
                                    fontStyle: 'italic'
                                }}>
                                    Your personal notes - NOT sent to AI
                                </div>
                                <textarea
                                    value={quest.notes}
                                    onChange={(e) => updateQuest(quest.id, 'notes', e.target.value)}
                                    placeholder="Your notes, ideas, reminders..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        color: '#e0e0e0',
                                        fontSize: '13px',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Debug Info */}
                            <div style={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px 12px'
                            }}>
                                <button
                                    onClick={() => toggleQuestDebug(quest.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '4px 0',
                                        textAlign: 'left'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.color = '#aaa'}
                                    onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                                >
                                    <span style={{ fontSize: '14px' }}>⚙️</span>
                                    <span>{quest.showDebug ? '▼' : '▶'} Debug Info</span>
                                </button>

                                {quest.showDebug && (
                                    <div style={{ marginTop: '8px' }}>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#888',
                                            marginBottom: '4px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Injection Preview:
                                        </div>
                                        <div style={{
                                            backgroundColor: '#252525',
                                            border: '1px solid #333',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            color: '#ddd',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            marginBottom: '8px',
                                            maxHeight: '150px',
                                            overflow: 'auto'
                                        }}>
                                            {getQuestInjectionPreview(quest)}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '11px',
                                            color: '#888'
                                        }}>
                                            <span>Estimated Tokens: <strong style={{ color: '#aaa' }}>~{estimateTokens(getQuestInjectionPreview(quest))}</strong></span>
                                            <button
                                                onClick={() => copyToClipboard(getQuestInjectionPreview(quest))}
                                                style={{
                                                    backgroundColor: '#2a3a5a',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
