import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import {PartyTrackerUI} from "./PartyTrackerUI";

/***
 TypeScript Interfaces for Party Tracker
 ***/
export interface StatEntry {
    label: string;       // "HP", "AC", "Stress", etc.
    currentValue: string; // "32", "18", "3", etc.
    maxValue: string;     // "45", "", "5", etc. (optional - leave empty for single-value stats)
}

export interface CustomField {
    id: string;
    label: string;       // "Inventory", "Personality", "History", etc.
    content: string;     // The actual text content
}

export interface Condition {
    id: string;
    label: string;       // "Poisoned", "Blessed", "Cursed", etc.
    isActive: boolean;   // Checkbox state
}

export interface PartyMember {
    id: string;           // UUID
    name: string;
    tags: string;         // "human, female, ranger"
    description: string;
    customFields: CustomField[];  // User-defined text sections
    conditions: Condition[];      // Status/condition tracking
    stats: StatEntry[];   // Flexible, user-defined
    secrets: string;      // Secret info - injected with DO NOT SHARE warning
    images: string[];     // Array of image URLs for character gallery
    isActive: boolean;    // Toggle whether character is currently in scene
    isCollapsed: boolean; // UI state for expand/collapse
    showDebug: boolean;   // UI state for debug info toggle
    showSecrets: boolean; // UI state for secrets section toggle
}

export interface UserCharacter {
    name: string;
    description: string;
    class: string;        // Class/Role
    stats: StatEntry[];
    inventory: string[];  // Simple array of items
    notes: string;        // Private notes, NOT injected
    showDebug: boolean;   // UI state for debug info toggle
}

export interface Objective {
    id: string;
    label: string;        // "Find the sword", "Talk to the king"
    isComplete: boolean;  // Checkbox state
}

export interface Quest {
    id: string;
    name: string;         // "Rescue the Princess" (user-facing)
    nextGoal: string;     // "find her location in the dungeons" (AI directive - INJECTED)
    objectives: Objective[];  // User checklist (NOT injected)
    notes: string;        // Private notes (NOT injected)
    status: 'active' | 'complete' | 'failed';  // Quest status
    isActive: boolean;    // Toggle whether quest steers the narrative (⭐)
    isCollapsed: boolean; // UI state
    showDebug: boolean;   // UI state for debug info
}

export interface Location {
    id: string;
    name: string;
    description: string;
    isActive: boolean;    // Inject when mentioned?
    isCollapsed: boolean; // UI state
}

export interface LoreEntry {
    id: string;
    title: string;
    content: string;
    tags: string;         // Comma-separated tags for categorization
    isCollapsed: boolean; // UI state
}

export interface ClockState {
    enabled: boolean;
    currentTime: string;  // e.g., "Day 3, 14:30" or "3rd Moon, Evening"
    format: 'custom' | 'numeric';  // Freeform vs structured
    notes: string;        // Private DM notes about time-sensitive events
}

export interface WorldData {
    locations: Location[];
    lore: LoreEntry[];
    clock: ClockState;
}

export interface PartyData {
    members: PartyMember[];
    userCharacter: UserCharacter;
    quests: Quest[];
    world: WorldData;
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
    
    // Get unique chat ID from URL
    private getChatId(): string | null {
        const match = window.location.pathname.match(/\/chats\/(\d+)/);
        return match ? match[1] : null;
    }
    
    // Get storage key scoped to current chat
    private getStorageKey(): string {
        const chatId = this.getChatId();
        return chatId ? `party-tracker-data-chat-${chatId}` : 'party-tracker-data-global';
    }

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        
        // Log chat ID for debugging
        const chatId = this.getChatId();
        console.log('[Party Tracker] Loaded in chat:', chatId || 'unknown (using global storage)');
        
        // Initialize party data from messageState or localStorage
        const { messageState } = data;
        
        if (messageState && messageState.members) {
            // Use messageState from the chat (most authoritative)
            this.partyData = this.migrateOldFormat(messageState);
        } else {
            // Try localStorage as fallback (scoped to this chat)
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.partyData = this.migrateOldFormat(parsed);
                } catch (e) {
                    console.error('[Party Tracker] Failed to parse saved party data:', e);
                    this.partyData = { 
                        members: [],
                        userCharacter: {
                            name: '',
                            description: '',
                            class: '',
                            stats: [],
                            inventory: [],
                            notes: '',
                            showDebug: false
                        },
                        quests: [],
                        world: {
                            locations: [],
                            lore: [],
                            clock: {
                                enabled: false,
                                currentTime: '',
                                format: 'custom',
                                notes: ''
                            }
                        }
                    };
                }
            } else {
                this.partyData = { 
                    members: [],
                    userCharacter: {
                        name: '',
                        description: '',
                        class: '',
                        stats: [],
                        inventory: [],
                        notes: '',
                        showDebug: false
                    },
                    quests: [],
                    world: {
                        locations: [],
                        lore: [],
                        clock: {
                            enabled: false,
                            currentTime: '',
                            format: 'custom',
                            notes: ''
                        }
                    }
                };
            }
        }
    }

    // Migrate old single-value format to current/max format
    private migrateOldFormat(data: any): PartyData {
        if (!data || !data.members) return { 
            members: [],
            userCharacter: {
                name: '',
                description: '',
                class: '',
                stats: [],
                inventory: [],
                notes: '',
                showDebug: false
            },
            quests: [],
            world: {
                locations: [],
                lore: [],
                clock: {
                    enabled: false,
                    currentTime: '',
                    format: 'custom',
                    notes: ''
                }
            }
        };
        
        return {
            members: data.members.map((member: any) => ({
                ...member,
                customFields: member.customFields || [],  // Add customFields if missing
                conditions: member.conditions || [],      // Add conditions if missing
                secrets: member.secrets || '',            // Add secrets if missing
                images: member.images || [],              // Add images if missing
                isActive: member.isActive !== undefined ? member.isActive : true, // Add isActive if missing (default true)
                showDebug: member.showDebug !== undefined ? member.showDebug : false, // Add showDebug if missing
                showSecrets: member.showSecrets !== undefined ? member.showSecrets : false, // Add showSecrets if missing
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
            })),
            userCharacter: data.userCharacter || {
                name: '',
                description: '',
                class: '',
                stats: [],
                inventory: [],
                notes: '',
                showDebug: false
            },
            quests: data.quests || [],
            world: data.world || {
                locations: [],
                lore: [],
                clock: {
                    enabled: false,
                    currentTime: '',
                    format: 'custom',
                    notes: ''
                }
            }
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
        if (state && state.members) {
            this.partyData = state;
            // Persist to localStorage (scoped to this chat)
            try {
                localStorage.setItem(this.getStorageKey(), JSON.stringify(this.partyData));
            } catch (e) {
                console.error('[Party Tracker] Failed to save to localStorage:', e);
            }
            // Trigger UI update if callback is set
            if (this.updateUICallback) {
                this.updateUICallback();
            }
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const { content } = userMessage;
        
        // Build stage directions
        let stageDirections: string | null = null;
        const directionsParts: string[] = [];
        
        // Inject User Character info (always included if data exists)
        const user = this.partyData.userCharacter;
        if (user.name.trim() || user.description.trim() || user.class.trim() || user.stats.length > 0 || user.inventory.length > 0) {
            let userInfo = `[PARTY TRACKER - USER`;
            if (user.name.trim()) {
                userInfo += `: ${user.name}`;
            }
            if (user.class.trim()) {
                userInfo += ` (${user.class})`;
            }
            if (user.description.trim()) {
                userInfo += ` - ${user.description}`;
            }
            if (user.inventory.length > 0) {
                const inventoryStr = user.inventory.filter(i => i.trim()).join(', ');
                if (inventoryStr) {
                    userInfo += `. Inventory: ${inventoryStr}`;
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
                    userInfo += `. Stats: ${statsStr}`;
                }
            }
            userInfo += `]`;
            directionsParts.push(userInfo);
        }
        
        // Search for character mentions in the user's message
        const mentionedCharacters: PartyMember[] = [];
        const messageLower = content.toLowerCase();
        
        for (const member of this.partyData.members) {
            // Skip inactive characters
            if (!member.isActive) continue;
            
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
        if (mentionedCharacters.length > 0) {
            const charInfos = mentionedCharacters.map(member => {
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
            });
            
            directionsParts.push(...charInfos);
        }
        
        // Inject active quests (directive-based narrative steering)
        const activeQuests = this.partyData.quests.filter(q => q.isActive && q.nextGoal.trim());
        if (activeQuests.length > 0) {
            const questGoals = activeQuests
                .map(q => q.nextGoal.trim())
                .join(', ');
            const questInfo = `[PARTY TRACKER - QUESTS: Steer the conversation toward ${questGoals}]`;
            directionsParts.push(questInfo);
        }
        
        // Search for location mentions in the user's message
        const mentionedLocations: Location[] = [];
        
        for (const location of this.partyData.world.locations) {
            // Skip inactive locations
            if (!location.isActive) continue;
            
            // Skip empty names
            if (!location.name.trim()) continue;
            
            // Check if location name is mentioned
            if (messageLower.includes(location.name.toLowerCase())) {
                mentionedLocations.push(location);
            }
        }
        
        // If locations were mentioned, inject their info
        if (mentionedLocations.length > 0) {
            const locationInfos = mentionedLocations.map(location => {
                let info = `[PARTY TRACKER - LOCATION: ${location.name}`;
                if (location.description.trim()) {
                    info += ` - ${location.description}`;
                }
                info += `]`;
                return info;
            });
            
            directionsParts.push(...locationInfos);
        }
        
        // Inject clock/time if enabled
        if (this.partyData.world.clock.enabled && this.partyData.world.clock.currentTime.trim()) {
            const clockInfo = `[PARTY TRACKER - TIME: {{char}} will always include the current time of day in this format; "${this.partyData.world.clock.currentTime}" at the top of every message, progressing time naturally as the conversation unfolds]`;
            directionsParts.push(clockInfo);
        }
        
        // Combine all directions
        if (directionsParts.length > 0) {
            stageDirections = directionsParts.join('\n');
        }
        
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
        try {
            const storageKey = this.getStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(this.partyData));
            console.log('[Party Tracker] Saved to:', storageKey);
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
