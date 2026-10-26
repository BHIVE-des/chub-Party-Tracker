import type {PartyMember, UserCharacter, Quest, Location, ClockState, StatEntry} from "./Stage";

/***
 Builders for the text injected into the prompt. Used by both the Stage
 (actual injection) and the tabs (debug previews), so the two never drift apart.
 ***/

// Escape a string for literal use inside a RegExp
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// True if `keyword` appears in `text` as a whole word/phrase (case-insensitive),
// so "Al" doesn't match "also" and "male" doesn't match "female".
export function mentionsKeyword(text: string, keyword: string): boolean {
    const trimmed = keyword.trim();
    if (!trimmed) return false;
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(trimmed)}(?=$|[^\\p{L}\\p{N}_])`, 'iu');
    return pattern.test(text);
}

const formatStats = (stats: StatEntry[]): string => stats
    .filter(s => s.label.trim() || s.currentValue.trim())
    .map(s => {
        const value = s.maxValue.trim()
            ? `${s.currentValue}/${s.maxValue}`
            : s.currentValue;
        return `${s.label}: ${value}`;
    })
    .join(', ');

export function hasUserInfo(user: UserCharacter): boolean {
    return !!(user.name.trim() || user.description.trim() || user.class.trim() || user.stats.length > 0 || user.inventory.length > 0);
}

export function buildUserInjection(user: UserCharacter): string {
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
    const inventoryStr = user.inventory.filter(i => i.trim()).join(', ');
    if (inventoryStr) {
        info += `. Inventory: ${inventoryStr}`;
    }
    const statsStr = formatStats(user.stats);
    if (statsStr) {
        info += `. Stats: ${statsStr}`;
    }
    info += `]`;
    return info;
}

export function isMemberMentioned(member: PartyMember, text: string): boolean {
    if (!member.isActive || !member.name.trim()) return false;
    if (mentionsKeyword(text, member.name)) return true;
    return member.tags.split(',').some(tag => mentionsKeyword(text, tag));
}

export function buildMemberInjection(member: PartyMember): string {
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
    const activeConditions = member.conditions
        .filter(c => c.isActive && c.label.trim())
        .map(c => c.label)
        .join(', ');
    if (activeConditions) {
        info += `. Currently: ${activeConditions}`;
    }
    // Add custom fields
    const customFieldsText = member.customFields
        .filter(f => f.label.trim() && f.content.trim())
        .map(f => `${f.label}: ${f.content}`)
        .join('. ');
    if (customFieldsText) {
        info += `. ${customFieldsText}`;
    }
    const statsStr = formatStats(member.stats);
    if (statsStr) {
        info += `. Stats: ${statsStr}`;
    }
    info += `]`;
    return info;
}

// A quest steers the story only while it's starred AND still in progress
export function isQuestInjected(quest: Quest): boolean {
    return quest.isActive && quest.status === 'active' && !!quest.nextGoal.trim();
}

export function buildQuestsInjection(quests: Quest[]): string | null {
    const goals = quests.filter(isQuestInjected).map(q => q.nextGoal.trim());
    if (goals.length === 0) return null;
    return `[PARTY TRACKER - QUESTS: Steer the conversation toward ${goals.join(', ')}]`;
}

export function isLocationMentioned(location: Location, text: string): boolean {
    return location.isActive && mentionsKeyword(text, location.name);
}

export function buildLocationInjection(location: Location): string {
    let info = `[PARTY TRACKER - LOCATION: ${location.name}`;
    if (location.description.trim()) {
        info += ` - ${location.description}`;
    }
    info += `]`;
    return info;
}

// The stored time is only a starting point, so the bot is told to continue
// from the latest time in the chat rather than resetting to it every message.
export function buildClockInjection(clock: ClockState): string | null {
    if (!clock.enabled || !clock.currentTime.trim()) return null;
    return `[PARTY TRACKER - TIME: {{char}} will always include the current time of day at the top of every message, in the same format as "${clock.currentTime}". Continue from the most recent time shown in the chat (or "${clock.currentTime}" if none is shown yet), progressing time naturally as the conversation unfolds]`;
}
