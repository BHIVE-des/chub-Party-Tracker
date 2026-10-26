import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import {PartyTrackerUI} from "./PartyTrackerUI";
import {
    hasUserInfo, buildUserInjection, isMemberMentioned, buildMemberInjection,
    buildQuestsInjection, isLocationMentioned, buildLocationInjection, buildClockInjection
} from "./injection";

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
 Fresh, empty tracker data
 ***/
export function emptyPartyData(): PartyData {
    return {
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

const generateFallbackId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const arrayOr = <T,>(value: any): T[] => Array.isArray(value) ? value : [];

// Old saves used a single 'value' field instead of current/max
const normalizeStats = (stats: any): StatEntry[] => arrayOr<any>(stats).map(stat => ({
    label: stat?.label || '',
    currentValue: stat?.currentValue ?? stat?.value ?? '',
    maxValue: stat?.maxValue || ''
}));

/***
 Migrate saved or imported data into the current PartyData shape,
 filling in anything missing from older versions or hand-edited JSON.
 ***/
export function normalizePartyData(data: any): PartyData {
    const empty = emptyPartyData();
    if (!data || typeof data !== 'object') return empty;

    return {
        members: arrayOr<any>(data.members).map(member => ({
            id: member.id || generateFallbackId(),
            name: member.name || '',
            tags: member.tags || '',
            description: member.description || '',
            customFields: arrayOr<CustomField>(member.customFields),
            conditions: arrayOr<Condition>(member.conditions),
            stats: normalizeStats(member.stats),
            secrets: member.secrets || '',
            images: arrayOr<string>(member.images),
            isActive: member.isActive ?? true,
            isCollapsed: member.isCollapsed ?? false,
            showDebug: member.showDebug ?? false,
            showSecrets: member.showSecrets ?? false
        })),
        userCharacter: {
            ...empty.userCharacter,
            ...(data.userCharacter || {}),
            stats: normalizeStats(data.userCharacter?.stats),
            inventory: arrayOr<string>(data.userCharacter?.inventory)
        },
        quests: arrayOr<any>(data.quests).map(quest => ({
            id: quest.id || generateFallbackId(),
            name: quest.name || '',
            nextGoal: quest.nextGoal || '',
            objectives: arrayOr<Objective>(quest.objectives),
            notes: quest.notes || '',
            status: quest.status || 'active',
            isActive: quest.isActive ?? true,
            isCollapsed: quest.isCollapsed ?? false,
            showDebug: quest.showDebug ?? false
        })),
        world: {
            locations: arrayOr<Location>(data.world?.locations),
            lore: arrayOr<LoreEntry>(data.world?.lore),
            clock: { ...empty.world.clock, ...(data.world?.clock || {}) }
        }
    };
}

/***
 The type that this stage persists message-level state in.
 Still written every message so chats from older versions keep loading.
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
 This is the source of truth: scoped to the chat and saved as soon as it's edited.
 ***/
type ChatStateType = PartyData;

// How long to wait after the last edit before saving to chub
const SAVE_DELAY_MS = 500;

/***
 Party Tracker Stage - A flexible character/party management system
 ***/
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    // Internal party data
    private partyData: PartyData;

    // Callback to trigger UI updates
    private updateUICallback?: () => void;

    // Pending debounced save to chat state
    private saveTimer?: ReturnType<typeof setTimeout>;

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);

        const { chatState, messageState } = data;

        // Chat state is authoritative; chats from older versions only have message state
        if (chatState && chatState.members) {
            this.partyData = normalizePartyData(chatState);
        } else if (messageState && messageState.members) {
            this.partyData = normalizePartyData(messageState);
        } else {
            this.partyData = emptyPartyData();
        }
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        return {
            success: true,
            error: null,
            initState: null,
            chatState: this.partyData,
        };
    }

    async setState(_state: MessageStateType): Promise<void> {
        // Tracker data is chat-level and only changes through the UI, so swipes and
        // jumps intentionally don't roll it back (that used to discard unsent edits).
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const { content } = userMessage;
        const { userCharacter, members, quests, world } = this.partyData;
        const directionsParts: string[] = [];

        // User Character info (always included if data exists)
        if (hasUserInfo(userCharacter)) {
            directionsParts.push(buildUserInjection(userCharacter));
        }

        // Party members mentioned by name or tag
        directionsParts.push(...members.filter(m => isMemberMentioned(m, content)).map(buildMemberInjection));

        // Active quests (directive-based narrative steering)
        const questInfo = buildQuestsInjection(quests);
        if (questInfo) directionsParts.push(questInfo);

        // Locations mentioned by name
        directionsParts.push(...world.locations.filter(l => isLocationMentioned(l, content)).map(buildLocationInjection));

        // Clock/time if enabled
        const clockInfo = buildClockInjection(world.clock);
        if (clockInfo) directionsParts.push(clockInfo);

        // This response saves chat state itself
        this.cancelPendingSave();

        return {
            stageDirections: directionsParts.length > 0 ? directionsParts.join('\n') : null,
            messageState: this.partyData,
            modifiedMessage: null,
            systemMessage: null,
            error: null,
            chatState: this.partyData,
        };
    }

    async afterResponse(_botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        this.cancelPendingSave();
        return {
            stageDirections: null,
            messageState: this.partyData,
            modifiedMessage: null,
            error: null,
            systemMessage: null,
            chatState: this.partyData,
        };
    }

    // Methods to update party data from UI
    getPartyData(): PartyData {
        return this.partyData;
    }

    updatePartyData(newData: PartyData): void {
        this.partyData = newData;
        this.scheduleSave();
    }

    // Save to chub's chat state shortly after edits stop, so changes persist without sending a message
    private scheduleSave(): void {
        this.cancelPendingSave();
        this.saveTimer = setTimeout(() => {
            this.saveTimer = undefined;
            this.messenger.updateChatState(this.partyData)
                .then(res => {
                    if (!res.success) console.error('[Party Tracker] Failed to save chat state:', res.error);
                })
                .catch(e => console.error('[Party Tracker] Failed to save chat state:', e));
        }, SAVE_DELAY_MS);
    }

    private cancelPendingSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = undefined;
        }
    }

    setUpdateCallback(callback: () => void): void {
        this.updateUICallback = callback;
    }

    render(): ReactElement {
        return <PartyTrackerUI stage={this} />;
    }
}
