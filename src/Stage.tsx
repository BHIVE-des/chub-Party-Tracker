import {ReactElement, useState, useEffect} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

/***
 TypeScript Interfaces for Party Tracker
 ***/
interface StatEntry {
    label: string;       // "HP", "AC", "Stress", etc.
    currentValue: string; // "32", "18", "3", etc.
    maxValue: string;     // "45", "", "5", etc. (optional - leave empty for single-value stats)
}

interface PartyMember {
    id: string;           // UUID
    name: string;
    tags: string;         // "human, female, ranger"
    description: string;
    stats: StatEntry[];   // Flexible, user-defined
    isCollapsed: boolean; // UI state for expand/collapse
}

interface PartyData {
    members: PartyMember[];
}

/***
 The type that this stage persists message-level state in.
 ***/
type MessageStateType = PartyData;

/***
 The type of the stage-specific configuration of this stage.
 ***/
type ConfigType = any;

/***
 The type that this stage persists chat initialization state in.
 ***/
type InitStateType = any;

/***
 The type that this stage persists dynamic chat-level state in.
 ***/
type ChatStateType = any;

/***
 Party Tracker Stage - A flexible character/party management system
 ***/
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
    
    // Internal party data
    private partyData: PartyData;
    
    // Callback to trigger UI updates
    private updateUICallback?: () => void;

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        
        // Initialize party data from messageState or localStorage
        const { messageState } = data;
        
        console.log('[Party Tracker] Constructor - messageState:', messageState);
        
        if (messageState && messageState.members) {
            // Use messageState from the chat (most authoritative)
            console.log('[Party Tracker] Loading from messageState');
            this.partyData = this.migrateOldFormat(messageState);
        } else {
            // Try localStorage as fallback
            console.log('[Party Tracker] messageState empty, trying localStorage');
            const saved = localStorage.getItem('party-tracker-data');
            console.log('[Party Tracker] localStorage value:', saved);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.partyData = this.migrateOldFormat(parsed);
                    console.log('[Party Tracker] Loaded from localStorage:', this.partyData);
                } catch (e) {
                    console.error('[Party Tracker] Failed to parse saved party data:', e);
                    this.partyData = { members: [] };
                }
            } else {
                console.log('[Party Tracker] No localStorage data, starting fresh');
                this.partyData = { members: [] };
            }
        }
        console.log('[Party Tracker] Final partyData:', this.partyData);
    }

    // Migrate old single-value format to current/max format
    private migrateOldFormat(data: any): PartyData {
        if (!data || !data.members) return { members: [] };
        
        return {
            members: data.members.map((member: any) => ({
                ...member,
                stats: member.stats?.map((stat: any) => {
                    // If it has the old 'value' field, migrate it
                    if ('value' in stat && !('currentValue' in stat)) {
                        return {
                            label: stat.label || '',
                            currentValue: stat.value || '',
                            maxValue: ''
                        };
                    }
                    // Already in new format or handle missing fields
                    return {
                        label: stat.label || '',
                        currentValue: stat.currentValue || '',
                        maxValue: stat.maxValue || ''
                    };
                }) || []
            }))
        };
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        return {
            success: true,
            error: null,
            initState: null,
            chatState: null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        // Handle state updates from swipes/jumps
        console.log('[Party Tracker] setState called with:', state);
        if (state && state.members) {
            this.partyData = state;
            // Persist to localStorage
            try {
                localStorage.setItem('party-tracker-data', JSON.stringify(this.partyData));
                console.log('[Party Tracker] setState saved to localStorage');
            } catch (e) {
                console.error('[Party Tracker] setState failed to save to localStorage:', e);
            }
            // Trigger UI update if callback is set
            if (this.updateUICallback) {
                this.updateUICallback();
            }
        } else {
            console.log('[Party Tracker] setState received invalid state');
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const { content } = userMessage;
        console.log('[Party Tracker] beforePrompt called, current partyData:', this.partyData);
        
        // Search for character mentions in the user's message
        const mentionedCharacters: PartyMember[] = [];
        const messageLower = content.toLowerCase();
        
        for (const member of this.partyData.members) {
            // Skip empty names
            if (!member.name.trim()) continue;
            
            // Check if name is mentioned
            if (messageLower.includes(member.name.toLowerCase())) {
                mentionedCharacters.push(member);
                continue;
            }
            
            // Check if any tags are mentioned
            if (member.tags.trim()) {
                const tags = member.tags.split(',').map(t => t.trim().toLowerCase());
                for (const tag of tags) {
                    if (tag && messageLower.includes(tag)) {
                        mentionedCharacters.push(member);
                        break;
                    }
                }
            }
        }
        
        // If characters were mentioned, inject their info
        let stageDirections: string | null = null;
        if (mentionedCharacters.length > 0) {
            const charInfos = mentionedCharacters.map(member => {
                let info = `[${member.name}`;
                if (member.tags.trim()) {
                    info += ` (${member.tags})`;
                }
                if (member.description.trim()) {
                    info += `: ${member.description}`;
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
            });
            
            stageDirections = charInfos.join('\n');
        }
        
        console.log('[Party Tracker] Returning messageState:', this.partyData);
        
        return {
            stageDirections,
            messageState: this.partyData,
            modifiedMessage: null,
            systemMessage: null,
            error: null,
            chatState: null,
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        return {
            stageDirections: null,
            messageState: this.partyData,
            modifiedMessage: null,
            error: null,
            systemMessage: null,
            chatState: null
        };
    }

    // Methods to update party data from UI
    getPartyData(): PartyData {
        return this.partyData;
    }

    updatePartyData(newData: PartyData): void {
        this.partyData = newData;
        console.log('[Party Tracker] Updating party data:', this.partyData);
        try {
            localStorage.setItem('party-tracker-data', JSON.stringify(this.partyData));
            console.log('[Party Tracker] Saved to localStorage successfully');
        } catch (e) {
            console.error('[Party Tracker] Failed to save to localStorage:', e);
        }
    }

    setUpdateCallback(callback: () => void): void {
        this.updateUICallback = callback;
    }

    render(): ReactElement {
        return <PartyTrackerUI stage={this} />;
    }
}

/***
 Main Party Tracker UI Component
 ***/
function PartyTrackerUI({ stage }: { stage: Stage }): ReactElement {
    // Force re-render when party data changes
    const [, forceUpdate] = useState({});
    
    useEffect(() => {
        // Set up callback so Stage can trigger re-renders
        stage.setUpdateCallback(() => forceUpdate({}));
    }, [stage]);
    
    const partyData = stage.getPartyData();

    // Generate a simple UUID
    const generateId = (): string => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Add a new party member
    const addMember = () => {
        const newMember: PartyMember = {
            id: generateId(),
            name: '',
            tags: '',
            description: '',
            stats: [],
            isCollapsed: false
        };
        const newData = {
            members: [...partyData.members, newMember]
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Remove a party member
    const removeMember = (id: string) => {
        const newData = {
            members: partyData.members.filter(m => m.id !== id)
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Update a party member field
    const updateMember = (id: string, field: keyof PartyMember, value: any) => {
        const newData = {
            members: partyData.members.map(m => 
                m.id === id ? { ...m, [field]: value } : m
            )
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Toggle collapse state
    const toggleCollapse = (id: string) => {
        const member = partyData.members.find(m => m.id === id);
        if (member) {
            updateMember(id, 'isCollapsed', !member.isCollapsed);
        }
    };

    // Add a stat to a member
    const addStat = (memberId: string) => {
        const member = partyData.members.find(m => m.id === memberId);
        if (member) {
            const newStats = [...member.stats, { label: '', currentValue: '', maxValue: '' }];
            updateMember(memberId, 'stats', newStats);
        }
    };

    // Update a stat
    const updateStat = (memberId: string, statIndex: number, field: keyof StatEntry, value: string) => {
        const member = partyData.members.find(m => m.id === memberId);
        if (member) {
            const newStats = member.stats.map((stat, idx) => 
                idx === statIndex ? { ...stat, [field]: value } : stat
            );
            updateMember(memberId, 'stats', newStats);
        }
    };

    // Remove a stat
    const removeStat = (memberId: string, statIndex: number) => {
        const member = partyData.members.find(m => m.id === memberId);
        if (member) {
            const newStats = member.stats.filter((_, idx) => idx !== statIndex);
            updateMember(memberId, 'stats', newStats);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            padding: '16px',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            color: '#e0e0e0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'auto',
            backdropFilter: 'blur(8px)'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #333'
            }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 600 }}>
                    Party Tracker
                </h2>
                <button
                    onClick={addMember}
                    style={{
                        width: '100%',
                        padding: '10px',
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
            </div>

            {/* Party Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {partyData.members.length === 0 && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        No party members yet. Click "Add Party Member" to get started!
                    </div>
                )}

                {partyData.members.map(member => (
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
                            marginBottom: member.isCollapsed ? '0' : '12px'
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
                                    placeholder="human, female, ranger"
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
                                        resize: 'vertical'
                                    }}
                                />

                                {/* Stats Section */}
                                <div style={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    width: '100%',
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
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
