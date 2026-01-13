import { ReactElement, useState, useMemo } from "react";
import { Location, LoreEntry, ClockState, WorldData } from "../Stage";

interface WorldTabProps {
    world: WorldData;
    updateWorld: (field: keyof WorldData, value: any) => void;
    estimateTokens: (text: string) => number;
    copyToClipboard: (text: string) => void;
    generateId: () => string;
}

export function WorldTab({
    world,
    updateWorld,
    estimateTokens,
    copyToClipboard,
    generateId
}: WorldTabProps): ReactElement {

    // Sorting state
    const [locationSortOrder, setLocationSortOrder] = useState<'default' | 'name-asc' | 'name-desc'>('default');
    const [loreSortOrder, setLoreSortOrder] = useState<'default' | 'title-asc' | 'title-desc'>('default');

    // Sort locations
    const sortedLocations = useMemo(() => {
        if (locationSortOrder === 'default') {
            return world.locations;
        }
        
        const sorted = [...world.locations].sort((a, b) => {
            const nameA = a.name.toLowerCase().trim() || 'zzz';
            const nameB = b.name.toLowerCase().trim() || 'zzz';
            
            if (locationSortOrder === 'name-asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });
        
        return sorted;
    }, [world.locations, locationSortOrder]);

    // Sort lore entries
    const sortedLore = useMemo(() => {
        if (loreSortOrder === 'default') {
            return world.lore;
        }
        
        const sorted = [...world.lore].sort((a, b) => {
            const titleA = a.title.toLowerCase().trim() || 'zzz';
            const titleB = b.title.toLowerCase().trim() || 'zzz';
            
            if (loreSortOrder === 'title-asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });
        
        return sorted;
    }, [world.lore, loreSortOrder]);

    // === LOCATION FUNCTIONS ===
    
    const addLocation = () => {
        const newLocation: Location = {
            id: generateId(),
            name: '',
            description: '',
            isActive: true,
            isCollapsed: false
        };
        updateWorld('locations', [...world.locations, newLocation]);
    };

    const removeLocation = (id: string) => {
        updateWorld('locations', world.locations.filter(loc => loc.id !== id));
    };

    const updateLocation = (id: string, field: keyof Location, value: any) => {
        updateWorld('locations', world.locations.map(loc =>
            loc.id === id ? { ...loc, [field]: value } : loc
        ));
    };

    const toggleLocationCollapse = (id: string) => {
        const location = world.locations.find(loc => loc.id === id);
        if (location) {
            updateLocation(id, 'isCollapsed', !location.isCollapsed);
        }
    };

    const toggleLocationActive = (id: string) => {
        const location = world.locations.find(loc => loc.id === id);
        if (location) {
            updateLocation(id, 'isActive', !location.isActive);
        }
    };

    const getLocationInjectionPreview = (location: Location): string => {
        let info = `[PARTY TRACKER - LOCATION: ${location.name}`;
        if (location.description.trim()) {
            info += ` - ${location.description}`;
        }
        info += `]`;
        return info;
    };

    // === LORE FUNCTIONS ===

    const addLoreEntry = () => {
        const newEntry: LoreEntry = {
            id: generateId(),
            title: '',
            content: '',
            tags: '',
            isCollapsed: false
        };
        updateWorld('lore', [...world.lore, newEntry]);
    };

    const removeLoreEntry = (id: string) => {
        updateWorld('lore', world.lore.filter(entry => entry.id !== id));
    };

    const updateLoreEntry = (id: string, field: keyof LoreEntry, value: any) => {
        updateWorld('lore', world.lore.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    };

    const toggleLoreCollapse = (id: string) => {
        const entry = world.lore.find(e => e.id === id);
        if (entry) {
            updateLoreEntry(id, 'isCollapsed', !entry.isCollapsed);
        }
    };

    // === CLOCK FUNCTIONS ===

    const updateClock = (field: keyof ClockState, value: any) => {
        updateWorld('clock', { ...world.clock, [field]: value });
    };

    const getClockInjectionPreview = (): string => {
        if (!world.clock.enabled || !world.clock.currentTime.trim()) {
            return '[Clock disabled - no time injection]';
        }
        return `[PARTY TRACKER - TIME: {{char}} will always include the current time of day in this format; "${world.clock.currentTime}" at the top of every message, progressing time naturally as the conversation unfolds]`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* CLOCK SECTION */}
            <div style={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#aaa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        🕐 Time Tracker
                    </div>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#aaa'
                    }}>
                        <input
                            type="checkbox"
                            checked={world.clock.enabled}
                            onChange={(e) => updateClock('enabled', e.target.checked)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: '#4a7a4a'
                            }}
                        />
                        <span>Enable Time Injection</span>
                    </label>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        value={world.clock.currentTime}
                        onChange={(e) => updateClock('currentTime', e.target.value)}
                        placeholder="e.g., 'Day 3, 14:30' or '3rd Moon, Evening'"
                        disabled={!world.clock.enabled}
                        style={{
                            width: '100%',
                            backgroundColor: world.clock.enabled ? '#1a1a1a' : '#111',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '10px',
                            color: world.clock.enabled ? '#fff' : '#555',
                            fontSize: '14px',
                            fontWeight: 600,
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#aaa',
                        marginBottom: '4px',
                        fontWeight: 600
                    }}>
                        📝 DM Notes (Private)
                    </label>
                    <div style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '8px',
                        fontStyle: 'italic'
                    }}>
                        Your notes about time-sensitive events - NOT injected
                    </div>
                    <textarea
                        value={world.clock.notes}
                        onChange={(e) => updateClock('notes', e.target.value)}
                        placeholder="Reminders about time-sensitive quests, deadlines, etc..."
                        rows={3}
                        disabled={!world.clock.enabled}
                        style={{
                            width: '100%',
                            backgroundColor: world.clock.enabled ? '#1a1a1a' : '#111',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '8px',
                            color: world.clock.enabled ? '#e0e0e0' : '#555',
                            fontSize: '13px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Clock Debug Preview */}
                <div style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                    color: '#888'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                        ⚙️ Injection Preview:
                    </div>
                    <div style={{
                        backgroundColor: '#252525',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        padding: '8px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#ddd',
                        marginBottom: '8px'
                    }}>
                        {getClockInjectionPreview()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Estimated Tokens: <strong style={{ color: '#aaa' }}>~{estimateTokens(getClockInjectionPreview())}</strong></span>
                        <button
                            onClick={() => copyToClipboard(getClockInjectionPreview())}
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
            </div>

            {/* LOCATIONS SECTION */}
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
                    📍 Known Locations
                </div>

                {/* Action Bar - Add + Sort */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                        onClick={addLocation}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#2a5a2a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#357535'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a5a2a'}
                    >
                        + Add Location
                    </button>
                    
                    <select
                        value={locationSortOrder}
                        onChange={(e) => setLocationSortOrder(e.target.value as 'default' | 'name-asc' | 'name-desc')}
                        style={{
                            padding: '10px',
                            backgroundColor: '#2a3a5a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            minWidth: '120px'
                        }}
                    >
                        <option value="default">⚡ Added</option>
                        <option value="name-asc">🔤 A→Z</option>
                        <option value="name-desc">🔤 Z→A</option>
                    </select>
                </div>

                {world.locations.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        fontSize: '12px',
                        fontStyle: 'italic'
                    }}>
                        No locations yet. Click "Add Location" to start!
                    </div>
                )}

                {sortedLocations.map(location => (
                    <div
                        key={location.id}
                        style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '10px',
                            marginBottom: '8px'
                        }}
                    >
                        {/* Header Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: location.isCollapsed ? '0' : '12px',
                            opacity: location.isActive ? 1 : 0.5
                        }}>
                            <button
                                onClick={() => toggleLocationCollapse(location.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '2px 6px'
                                }}
                            >
                                {location.isCollapsed ? '▶' : '▼'}
                            </button>
                            <input
                                type="text"
                                value={location.name}
                                onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                                placeholder="Location Name"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#252525',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '6px 8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                            />
                            <button
                                onClick={() => toggleLocationActive(location.id)}
                                title={location.isActive ? "Location is active (will inject when mentioned)" : "Location is inactive (will NOT inject)"}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: location.isActive ? '#ffd700' : '#555',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '2px 6px',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {location.isActive ? '⭐' : '☆'}
                            </button>
                            <button
                                onClick={() => removeLocation(location.id)}
                                style={{
                                    backgroundColor: '#5a2a2a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#753535'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#5a2a2a'}
                            >
                                Delete
                            </button>
                        </div>

                        {/* Expanded Content */}
                        {!location.isCollapsed && (
                            <div style={{ paddingLeft: '26px' }}>
                                <textarea
                                    value={location.description}
                                    onChange={(e) => updateLocation(location.id, 'description', e.target.value)}
                                    placeholder="Location description (injected when location is mentioned)..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#252525',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        color: '#e0e0e0',
                                        fontSize: '13px',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                        marginBottom: '8px'
                                    }}
                                />

                                {/* Debug Preview */}
                                <div style={{
                                    backgroundColor: '#252525',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    fontSize: '11px',
                                    color: '#888'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                                        ⚙️ Injection Preview:
                                    </div>
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        fontFamily: 'monospace',
                                        fontSize: '10px',
                                        color: '#ddd',
                                        marginBottom: '6px',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        {getLocationInjectionPreview(location)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px' }}>Tokens: ~{estimateTokens(getLocationInjectionPreview(location))}</span>
                                        <button
                                            onClick={() => copyToClipboard(getLocationInjectionPreview(location))}
                                            style={{
                                                backgroundColor: '#2a3a5a',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '3px 6px',
                                                cursor: 'pointer',
                                                fontSize: '10px'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* LORE SECTION */}
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
                    📜 Lore Entries
                </div>

                <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '12px',
                    fontStyle: 'italic'
                }}>
                    Personal worldbuilding notes - NOT injected into AI
                </div>

                {/* Action Bar - Add + Sort */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                        onClick={addLoreEntry}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#2a3a5a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                    >
                        + Add Lore Entry
                    </button>
                    
                    <select
                        value={loreSortOrder}
                        onChange={(e) => setLoreSortOrder(e.target.value as 'default' | 'title-asc' | 'title-desc')}
                        style={{
                            padding: '10px',
                            backgroundColor: '#2a3a5a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            minWidth: '120px'
                        }}
                    >
                        <option value="default">⚡ Added</option>
                        <option value="title-asc">🔤 A→Z</option>
                        <option value="title-desc">🔤 Z→A</option>
                    </select>
                </div>

                {world.lore.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        fontSize: '12px',
                        fontStyle: 'italic'
                    }}>
                        No lore entries yet. Click "Add Lore Entry" to start!
                    </div>
                )}

                {sortedLore.map(entry => (
                    <div
                        key={entry.id}
                        style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '10px',
                            marginBottom: '8px'
                        }}
                    >
                        {/* Header Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: entry.isCollapsed ? '0' : '12px'
                        }}>
                            <button
                                onClick={() => toggleLoreCollapse(entry.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '2px 6px'
                                }}
                            >
                                {entry.isCollapsed ? '▶' : '▼'}
                            </button>
                            <input
                                type="text"
                                value={entry.title}
                                onChange={(e) => updateLoreEntry(entry.id, 'title', e.target.value)}
                                placeholder="Lore Entry Title"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#252525',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '6px 8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                            />
                            <button
                                onClick={() => removeLoreEntry(entry.id)}
                                style={{
                                    backgroundColor: '#5a2a2a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#753535'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#5a2a2a'}
                            >
                                Delete
                            </button>
                        </div>

                        {/* Expanded Content */}
                        {!entry.isCollapsed && (
                            <div style={{ paddingLeft: '26px' }}>
                                <input
                                    type="text"
                                    value={entry.tags}
                                    onChange={(e) => updateLoreEntry(entry.id, 'tags', e.target.value)}
                                    placeholder="tags, categories, keywords"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#252525',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        color: '#aaa',
                                        fontSize: '12px',
                                        fontStyle: 'italic',
                                        marginBottom: '8px',
                                        boxSizing: 'border-box'
                                    }}
                                />

                                <textarea
                                    value={entry.content}
                                    onChange={(e) => updateLoreEntry(entry.id, 'content', e.target.value)}
                                    placeholder="Lore details, history, notes..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#252525',
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
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
