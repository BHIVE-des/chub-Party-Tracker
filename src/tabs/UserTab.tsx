import { ReactElement } from "react";
import { UserCharacter, StatEntry } from "../Stage";

interface UserTabProps {
    userCharacter: UserCharacter;
    updateUserCharacter: (field: keyof UserCharacter, value: any) => void;
    estimateTokens: (text: string) => number;
    copyToClipboard: (text: string) => void;
}

export function UserTab({ userCharacter, updateUserCharacter, estimateTokens, copyToClipboard }: UserTabProps): ReactElement {
    
    // Add user stat
    const addUserStat = () => {
        const newStats = [...userCharacter.stats, { label: '', currentValue: '', maxValue: '' }];
        updateUserCharacter('stats', newStats);
    };

    // Update user stat
    const updateUserStat = (statIndex: number, field: keyof StatEntry, value: string) => {
        const newStats = userCharacter.stats.map((stat, idx) => 
            idx === statIndex ? { ...stat, [field]: value } : stat
        );
        updateUserCharacter('stats', newStats);
    };

    // Remove user stat
    const removeUserStat = (statIndex: number) => {
        const newStats = userCharacter.stats.filter((_, idx) => idx !== statIndex);
        updateUserCharacter('stats', newStats);
    };

    // Add inventory item
    const addInventoryItem = (item: string) => {
        if (item.trim()) {
            const newInventory = [...userCharacter.inventory, item.trim()];
            updateUserCharacter('inventory', newInventory);
        }
    };

    // Remove inventory item
    const removeInventoryItem = (index: number) => {
        const newInventory = userCharacter.inventory.filter((_, idx) => idx !== index);
        updateUserCharacter('inventory', newInventory);
    };

    // Generate injection preview for user character
    const getUserInjectionPreview = (): string => {
        const user = userCharacter;
        let info = `[PARTY TRACKER - USER`;
        if (user.name.trim()) {
            info += `: ${user.name}`;
        }
        if (user.class.trim()) {
            info += ` (${user.class})`;
        }
        if (user.description.trim()) {
            info += ` - ${user.description}`;
        }
        if (user.inventory.length > 0) {
            const inventoryStr = user.inventory.filter(i => i.trim()).join(', ');
            if (inventoryStr) {
                info += `. Inventory: ${inventoryStr}`;
            }
        }
        if (user.stats.length > 0) {
            const statsStr = user.stats
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Profile Section */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#aaa',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    👤 Your Character
                </div>

                <input
                    type="text"
                    value={userCharacter.name}
                    onChange={(e) => updateUserCharacter('name', e.target.value)}
                    placeholder="Your character's name"
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                    }}
                />

                <input
                    type="text"
                    value={userCharacter.class}
                    onChange={(e) => updateUserCharacter('class', e.target.value)}
                    placeholder="comma, seperated, keywords"
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '8px',
                        color: '#aaa',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                    }}
                />

                <textarea
                    value={userCharacter.description}
                    onChange={(e) => updateUserCharacter('description', e.target.value)}
                    placeholder="Your character's description, backstory, personality..."
                    rows={4}
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#e0e0e0',
                        fontSize: '13px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Stats Section */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#aaa',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    📊 Stats
                </div>

                {userCharacter.stats.map((stat, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                            alignItems: 'center'
                        }}
                    >
                        <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => updateUserStat(idx, 'label', e.target.value)}
                            placeholder="HP"
                            style={{
                                flex: '0 0 65px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <input
                            type="text"
                            value={stat.currentValue}
                            onChange={(e) => updateUserStat(idx, 'currentValue', e.target.value)}
                            placeholder="45"
                            style={{
                                flex: 1,
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <span style={{ color: '#666', fontSize: '13px' }}>/</span>
                        <input
                            type="text"
                            value={stat.maxValue}
                            onChange={(e) => updateUserStat(idx, 'maxValue', e.target.value)}
                            placeholder="(max)"
                            title="Optional max value"
                            style={{
                                flex: 1,
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={() => removeUserStat(idx)}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#999',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
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
                    onClick={addUserStat}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2a3a5a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                >
                    + Add Stat
                </button>
            </div>

            {/* Inventory Section */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#aaa',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    🎒 Inventory
                </div>

                <input
                    type="text"
                    placeholder="Type item name and press Enter..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            addInventoryItem(e.currentTarget.value);
                            e.currentTarget.value = '';
                        }
                    }}
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '13px',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                    }}
                />

                {userCharacter.inventory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {userCharacter.inventory.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '8px 12px'
                                }}
                            >
                                <span style={{ flex: 1, color: '#e0e0e0', fontSize: '13px' }}>
                                    {item}
                                </span>
                                <button
                                    onClick={() => removeInventoryItem(idx)}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#999',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        padding: '2px 6px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.color = '#ff6666'}
                                    onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        fontSize: '12px',
                        fontStyle: 'italic'
                    }}>
                        No items yet. Add items above!
                    </div>
                )}
            </div>

            {/* Personal Notes Section */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#aaa',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    📝 Personal Notes
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '12px',
                    fontStyle: 'italic'
                }}>
                    Private notes - NOT sent to AI
                </div>

                <textarea
                    value={userCharacter.notes}
                    onChange={(e) => updateUserCharacter('notes', e.target.value)}
                    placeholder="Your personal notes, reminders, plans..."
                    rows={4}
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#e0e0e0',
                        fontSize: '13px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Debug Info for User Character */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <button
                    onClick={() => updateUserCharacter('showDebug', !userCharacter.showDebug)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '4px 0',
                        textAlign: 'left'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#aaa'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                >
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    <span>{userCharacter.showDebug ? '▼' : '▶'} Debug Info</span>
                </button>

                {userCharacter.showDebug && (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#888',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Injection Preview:
                        </div>
                        <div style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            padding: '12px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#ddd',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            marginBottom: '12px',
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            {getUserInjectionPreview()}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            color: '#888'
                        }}>
                            <span>Estimated Tokens: <strong style={{ color: '#aaa' }}>~{estimateTokens(getUserInjectionPreview())}</strong></span>
                            <button
                                onClick={() => copyToClipboard(getUserInjectionPreview())}
                                style={{
                                    backgroundColor: '#2a3a5a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
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
    );
}
