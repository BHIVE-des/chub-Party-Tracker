import { ReactElement, useState } from "react";
import { PartyMember, StatEntry, CustomField, Condition } from "../Stage";

interface PartyTabProps {
    members: PartyMember[];
    addMember: () => void;
    removeMember: (id: string) => void;
    updateMember: (id: string, field: keyof PartyMember, value: any) => void;
    estimateTokens: (text: string) => number;
    copyToClipboard: (text: string) => void;
    generateId: () => string;
}

export function PartyTab({ 
    members, 
    addMember, 
    removeMember, 
    updateMember,
    estimateTokens,
    copyToClipboard,
    generateId
}: PartyTabProps): ReactElement {
    
    // State for full-size image modal
    const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

    // Toggle collapse state
    const toggleCollapse = (id: string) => {
        const member = members.find(m => m.id === id);
        if (member) {
            updateMember(id, 'isCollapsed', !member.isCollapsed);
        }
    };

    // Add a stat to a member
    const addStat = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newStats = [...member.stats, { label: '', currentValue: '', maxValue: '' }];
            updateMember(memberId, 'stats', newStats);
        }
    };

    // Update a stat
    const updateStat = (memberId: string, statIndex: number, field: keyof StatEntry, value: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newStats = member.stats.map((stat, idx) => 
                idx === statIndex ? { ...stat, [field]: value } : stat
            );
            updateMember(memberId, 'stats', newStats);
        }
    };

    // Remove a stat
    const removeStat = (memberId: string, statIndex: number) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newStats = member.stats.filter((_, idx) => idx !== statIndex);
            updateMember(memberId, 'stats', newStats);
        }
    };

    // Add a custom field to a member
    const addCustomField = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newFields = [...member.customFields, { id: generateId(), label: '', content: '' }];
            updateMember(memberId, 'customFields', newFields);
        }
    };

    // Update a custom field
    const updateCustomField = (memberId: string, fieldId: string, key: keyof CustomField, value: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newFields = member.customFields.map(f => 
                f.id === fieldId ? { ...f, [key]: value } : f
            );
            updateMember(memberId, 'customFields', newFields);
        }
    };

    // Remove a custom field
    const removeCustomField = (memberId: string, fieldId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newFields = member.customFields.filter(f => f.id !== fieldId);
            updateMember(memberId, 'customFields', newFields);
        }
    };

    // Add a condition to a member
    const addCondition = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newConditions = [...member.conditions, { id: generateId(), label: '', isActive: false }];
            updateMember(memberId, 'conditions', newConditions);
        }
    };

    // Update a condition
    const updateCondition = (memberId: string, conditionId: string, key: keyof Condition, value: any) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newConditions = member.conditions.map(c => 
                c.id === conditionId ? { ...c, [key]: value } : c
            );
            updateMember(memberId, 'conditions', newConditions);
        }
    };

    // Toggle condition active state
    const toggleCondition = (memberId: string, conditionId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const condition = member.conditions.find(c => c.id === conditionId);
            if (condition) {
                updateCondition(memberId, conditionId, 'isActive', !condition.isActive);
            }
        }
    };

    // Remove a condition
    const removeCondition = (memberId: string, conditionId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newConditions = member.conditions.filter(c => c.id !== conditionId);
            updateMember(memberId, 'conditions', newConditions);
        }
    };

    // Toggle debug info display
    const toggleDebug = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            updateMember(memberId, 'showDebug', !member.showDebug);
        }
    };

    // Toggle secrets display
    const toggleSecrets = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            updateMember(memberId, 'showSecrets', !member.showSecrets);
        }
    };

    // Toggle active state
    const toggleActive = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            updateMember(memberId, 'isActive', !member.isActive);
        }
    };

    // Add image URL
    const addImage = (memberId: string, url: string) => {
        const member = members.find(m => m.id === memberId);
        if (member && url.trim()) {
            const newImages = [...member.images, url.trim()];
            updateMember(memberId, 'images', newImages);
        }
    };

    // Remove image
    const removeImage = (memberId: string, imageIndex: number) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            const newImages = member.images.filter((_, idx) => idx !== imageIndex);
            updateMember(memberId, 'images', newImages);
        }
    };

    // Generate injection preview for a member
    const getInjectionPreview = (member: PartyMember): string => {
        let info = `[PARTY TRACKER - PARTY: ${member.name}`;
        if (member.tags.trim()) {
            info += ` (${member.tags})`;
        }
        if (member.description.trim()) {
            info += ` - ${member.description}`;
        }
        // Add secrets with DO NOT SHARE warning
        if (member.secrets.trim()) {
            info += `. ((DO NOT SHARE THIS SECRET: ${member.secrets}))`;
        }
        // Add active conditions
        if (member.conditions && member.conditions.length > 0) {
            const activeConditions = member.conditions
                .filter(c => c.isActive && c.label.trim())
                .map(c => c.label)
                .join(', ');
            if (activeConditions) {
                info += `. Currently: ${activeConditions}`;
            }
        }
        // Add custom fields
        if (member.customFields && member.customFields.length > 0) {
            const customFieldsText = member.customFields
                .filter(f => f.label.trim() && f.content.trim())
                .map(f => `${f.label}: ${f.content}`)
                .join('. ');
            if (customFieldsText) {
                info += `. ${customFieldsText}`;
            }
        }
        if (member.stats.length > 0) {
            const statsStr = member.stats
                .filter(s => s.label.trim() || s.currentValue.trim())
                .map(s => {
                    const value = s.maxValue.trim() 
                        ? `${s.currentValue}/${s.maxValue}` 
                        : s.currentValue;
                    return `${s.label}: ${value}`;
                })
                .join(', ');
            if (statsStr) {
                info += `. Stats: ${statsStr}`;
            }
        }
        info += `]`;
        return info;
    };

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={addMember}
                    style={{
                        width: '100%',
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
                    + Add Party Member
                </button>

                {members.length === 0 && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        No party members yet. Click "Add Party Member" to get started!
                    </div>
                )}

                {/* Party Members */}
                {members.map(member => (
                    <div
                        key={member.id}
                        style={{
                            backgroundColor: '#252525',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            padding: '12px'
                        }}
                    >
                        {/* Header Row - Name & Collapse Toggle */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: member.isCollapsed ? '0' : '12px',
                            opacity: member.isActive ? 1 : 0.5
                        }}>
                            <button
                                onClick={() => toggleCollapse(member.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '4px 8px'
                                }}
                            >
                                {member.isCollapsed ? '▶' : '▼'}
                            </button>
                            {/* Thumbnail Image */}
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: member.images.length > 0 ? '2px solid #555' : '2px dashed #555',
                                    backgroundColor: '#1a1a1a',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {member.images.length > 0 ? (
                                    <img
                                        src={member.images[0]}
                                        alt={member.name || 'Character'}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '18px', color: '#555' }}>🖼️</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={member.name}
                                onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                placeholder="Character Name"
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
                                onClick={() => toggleActive(member.id)}
                                title={member.isActive ? "Character is active (will be injected when mentioned)" : "Character is inactive (will NOT be injected)"}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: member.isActive ? '#ffd700' : '#555',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    padding: '4px 8px',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {member.isActive ? '⭐' : '☆'}
                            </button>
                            <button
                                onClick={() => removeMember(member.id)}
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
                        {!member.isCollapsed && (
                            <div style={{ paddingLeft: '32px' }}>
                                {/* Tags */}
                                <input
                                    type="text"
                                    value={member.tags}
                                    onChange={(e) => updateMember(member.id, 'tags', e.target.value)}
                                    placeholder="comma, seperated, keywords,"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        color: '#aaa',
                                        fontSize: '12px',
                                        fontStyle: 'italic',
                                        marginBottom: '12px'
                                    }}
                                />

                                {/* Image Gallery Section */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#aaa',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        🖼️ Character Images
                                    </div>

                                    {/* Image URL Input */}
                                    <input
                                        type="text"
                                        placeholder="Paste image URL and press Enter..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget;
                                                addImage(member.id, input.value);
                                                input.value = '';
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#252525',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            color: '#fff',
                                            fontSize: '13px',
                                            marginBottom: '12px',
                                            boxSizing: 'border-box'
                                        }}
                                    />

                                    {/* Image Gallery Grid */}
                                    {member.images.length > 0 && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                            gap: '8px'
                                        }}>
                                            {member.images.map((imageUrl, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        paddingBottom: '100%',
                                                        backgroundColor: '#252525',
                                                        border: '2px dashed #444',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setFullSizeImage(imageUrl)}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`${member.name} - ${idx + 1}`}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeImage(member.id, idx);
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            cursor: 'pointer',
                                                            fontSize: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {member.images.length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '20px',
                                            color: '#666',
                                            fontSize: '12px',
                                            fontStyle: 'italic'
                                        }}>
                                            No images yet. Paste a URL above and press Enter!
                                        </div>
                                    )}
                                </div>

                                {/* Secrets Section - Collapsible */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    boxSizing: 'border-box',
                                    marginBottom: '12px'
                                }}>
                                    <button
                                        onClick={() => toggleSecrets(member.id)}
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
                                        <span style={{ fontSize: '14px' }}>🤫</span>
                                        <span>{member.showSecrets ? '▼' : '▶'} Secrets (Hidden from User)</span>
                                    </button>

                                    {member.showSecrets && (
                                        <div style={{ marginTop: '8px' }}>
                                            <textarea
                                                value={member.secrets}
                                                onChange={(e) => updateMember(member.id, 'secrets', e.target.value)}
                                                placeholder="Secret information that AI should not reveal unless dramatically appropriate or intimate..."
                                                rows={3}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #555',
                                                    borderRadius: '4px',
                                                    padding: '8px',
                                                    color: '#e0e0e0',
                                                    fontSize: '13px',
                                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                                    resize: 'vertical',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#666',
                                                marginTop: '4px',
                                                fontStyle: 'italic'
                                            }}>
                                                ⚠️ AI will be instructed: "DO NOT SHARE THIS SECRET" unless appropriate
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <textarea
                                    value={member.description}
                                    onChange={(e) => updateMember(member.id, 'description', e.target.value)}
                                    placeholder="Character description..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        color: '#e0e0e0',
                                        fontSize: '13px',
                                        marginBottom: '12px',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />

                                {/* Custom Fields Section */}
                                {member.customFields.map((field) => (
                                    <div
                                        key={field.id}
                                        style={{
                                            marginBottom: '12px',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginBottom: '8px',
                                            alignItems: 'center'
                                        }}>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => updateCustomField(member.id, field.id, 'label', e.target.value)}
                                                placeholder="Field Name (e.g., Inventory, Personality)"
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #555',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={() => removeCustomField(member.id, field.id)}
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
                                        <textarea
                                            value={field.content}
                                            onChange={(e) => updateCustomField(member.id, field.id, 'content', e.target.value)}
                                            placeholder="Enter content..."
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#252525',
                                                border: '1px solid #555',
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
                                ))}

                                {/* Add Custom Field Button */}
                                <button
                                    onClick={() => addCustomField(member.id)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: '#2a2a5a',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginBottom: '12px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#353575'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a5a'}
                                >
                                    + Add Custom Field
                                </button>

                                {/* Conditions Section */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#aaa',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Conditions
                                    </div>

                                    {member.conditions.map((condition) => (
                                        <div
                                            key={condition.id}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '6px',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={condition.isActive}
                                                onChange={() => toggleCondition(member.id, condition.id)}
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
                                                value={condition.label}
                                                onChange={(e) => updateCondition(member.id, condition.id, 'label', e.target.value)}
                                                placeholder="Condition name (e.g., Poisoned, Blessed)"
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px',
                                                    color: condition.isActive ? '#fff' : '#888',
                                                    fontSize: '13px',
                                                    textDecoration: condition.isActive ? 'none' : 'line-through',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={() => removeCondition(member.id, condition.id)}
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
                                        onClick={() => addCondition(member.id)}
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
                                        + Add Condition
                                    </button>
                                </div>

                                {/* Stats Section */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    width: '100%',
                                    boxSizing: 'border-box',
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
                                        Stats
                                    </div>

                                    {member.stats.map((stat, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '6px',
                                                alignItems: 'center',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={stat.label}
                                                onChange={(e) => updateStat(member.id, idx, 'label', e.target.value)}
                                                placeholder="HP"
                                                style={{
                                                    flex: '0 0 65px',
                                                    minWidth: '65px',
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={stat.currentValue}
                                                onChange={(e) => updateStat(member.id, idx, 'currentValue', e.target.value)}
                                                placeholder="32"
                                                style={{
                                                    flex: 1,
                                                    minWidth: '50px',
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <span style={{
                                                color: '#666',
                                                fontSize: '13px',
                                                padding: '0 2px',
                                                flexShrink: 0
                                            }}>/</span>
                                            <input
                                                type="text"
                                                value={stat.maxValue}
                                                onChange={(e) => updateStat(member.id, idx, 'maxValue', e.target.value)}
                                                placeholder="(max)"
                                                title="Optional - Leave empty for single-value stats like AC, STR, etc."
                                                style={{
                                                    flex: 1,
                                                    minWidth: '50px',
                                                    backgroundColor: '#252525',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    padding: '6px 8px',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={() => removeStat(member.id, idx)}
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
                                        onClick={() => addStat(member.id)}
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
                                        + Add Stat
                                    </button>
                                </div>

                                {/* Debug Info Section */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    boxSizing: 'border-box'
                                }}>
                                    <button
                                        onClick={() => toggleDebug(member.id)}
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
                                        <span>{member.showDebug ? '▼' : '▶'} Debug Info</span>
                                    </button>

                                    {member.showDebug && (
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
                                                overflow: 'auto',
                                                boxSizing: 'border-box'
                                            }}>
                                                {getInjectionPreview(member)}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '11px',
                                                color: '#888'
                                            }}>
                                                <span>Estimated Tokens: <strong style={{ color: '#aaa' }}>~{estimateTokens(getInjectionPreview(member))}</strong></span>
                                                <button
                                                    onClick={() => copyToClipboard(getInjectionPreview(member))}
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

            {/* Full-Size Image Modal */}
            {fullSizeImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        cursor: 'pointer'
                    }}
                    onClick={() => setFullSizeImage(null)}
                >
                    <img
                        src={fullSizeImage}
                        alt="Full size"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                    />
                    <button
                        onClick={() => setFullSizeImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
}
