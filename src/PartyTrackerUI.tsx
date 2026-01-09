import {ReactElement, useState, useEffect} from "react";
import {Stage, PartyMember, UserCharacter, Quest, WorldData} from "./Stage";
import { UserTab } from "./tabs/UserTab";
import { PartyTab } from "./tabs/PartyTab";
import { QuestsTab } from "./tabs/QuestsTab";
import { WorldTab } from "./tabs/WorldTab";

/***
 Main Party Tracker UI Component - Coordinator
 ***/
export function PartyTrackerUI({ stage }: { stage: Stage }): ReactElement {
    // Force re-render when party data changes
    const [, forceUpdate] = useState({});
    
    // Active tab state
    const [activeTab, setActiveTab] = useState<'user' | 'party' | 'quests' | 'world'>('party');
    
    // State for import/export modals
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(false);
    
    useEffect(() => {
        // Set up callback so Stage can trigger re-renders
        stage.setUpdateCallback(() => forceUpdate({}));
    }, [stage]);
    
    const partyData = stage.getPartyData();

    /***
     * SHARED UTILITY FUNCTIONS
     ***/

    // Generate a simple UUID
    const generateId = (): string => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Estimate token count (rough approximation: ~4 characters per token)
    const estimateTokens = (text: string): number => {
        return Math.ceil(text.length / 4);
    };

    // Copy text to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Export party data as JSON (show modal)
    const exportData = () => {
        setShowExportModal(true);
    };

    // Import party data from JSON text
    const importData = () => {
        try {
            const imported = JSON.parse(importText);
            
            // Validate basic structure
            if (!imported || typeof imported !== 'object') {
                return;
            }
            
            if (!Array.isArray(imported.members)) {
                return;
            }

            // Import and update
            stage.updatePartyData(imported);
            forceUpdate({});
            setShowImportModal(false);
            setImportText('');
        } catch (error) {
            console.error('Import error:', error);
        }
    };

    /***
     * USER CHARACTER FUNCTIONS
     ***/
    
    // Update user character field
    const updateUserCharacter = (field: keyof UserCharacter, value: any) => {
        const newData = {
            ...partyData,
            userCharacter: { ...partyData.userCharacter, [field]: value }
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    /***
     * PARTY MEMBER FUNCTIONS
     ***/

    // Add a new party member
    const addMember = () => {
        const newMember: PartyMember = {
            id: generateId(),
            name: '',
            tags: '',
            description: '',
            customFields: [],
            conditions: [],
            stats: [],
            secrets: '',
            images: [],
            isActive: true,
            isCollapsed: false,
            showDebug: false,
            showSecrets: false
        };
        const newData = {
            ...partyData,
            members: [...partyData.members, newMember]
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Remove a party member
    const removeMember = (id: string) => {
        const newData = {
            ...partyData,
            members: partyData.members.filter(m => m.id !== id)
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Update a party member field
    const updateMember = (id: string, field: keyof PartyMember, value: any) => {
        const newData = {
            ...partyData,
            members: partyData.members.map(m => 
                m.id === id ? { ...m, [field]: value } : m
            )
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    /***
     * QUEST FUNCTIONS
     ***/

    // Add a new quest
    const addQuest = () => {
        const newQuest: Quest = {
            id: generateId(),
            name: '',
            nextGoal: '',
            objectives: [],
            notes: '',
            status: 'active',
            isActive: true,
            isCollapsed: false,
            showDebug: false
        };
        const newData = {
            ...partyData,
            quests: [...partyData.quests, newQuest]
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Remove a quest
    const removeQuest = (id: string) => {
        const newData = {
            ...partyData,
            quests: partyData.quests.filter(q => q.id !== id)
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    // Update a quest field
    const updateQuest = (id: string, field: keyof Quest, value: any) => {
        const newData = {
            ...partyData,
            quests: partyData.quests.map(q => 
                q.id === id ? { ...q, [field]: value } : q
            )
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    /***
     * WORLD FUNCTIONS
     ***/

    // Update a world field
    const updateWorld = (field: keyof WorldData, value: any) => {
        const newData = {
            ...partyData,
            world: { ...partyData.world, [field]: value }
        };
        stage.updatePartyData(newData);
        forceUpdate({});
    };

    /***
     * RENDER
     ***/

    return (
        <>
            <style>{`
                /* Scrollbar styling for Party Tracker main container */
                .party-tracker-container {
                    overflow-y: scroll !important;
                    overflow-x: hidden !important;
                    scrollbar-width: thin;
                    scrollbar-color: #555 #2a2a2a;
                }
                .party-tracker-container::-webkit-scrollbar {
                    width: 10px;
                }
                .party-tracker-container::-webkit-scrollbar-track {
                    background: #2a2a2a;
                    border-radius: 5px;
                }
                .party-tracker-container::-webkit-scrollbar-thumb {
                    background: #555;
                    border-radius: 5px;
                }
                .party-tracker-container::-webkit-scrollbar-thumb:hover {
                    background: #666;
                }
            `}</style>
            <div 
                className="party-tracker-container"
                style={{
                    width: '100%',
                    height: '100vh',
                    padding: '16px',
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    color: '#e0e0e0',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    backdropFilter: 'blur(8px)',
                    boxSizing: 'border-box',
                    position: 'relative'
                } as React.CSSProperties}>
            
            {/* Header with Tabs */}
            <div style={{
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                        Party Tracker
                    </h2>
                    
                    {/* Import/Export Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={exportData}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#2a3a5a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#354a75'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a3a5a'}
                            title="Export party data as JSON"
                        >
                            📥 Export
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#2a5a2a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#357535'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a5a2a'}
                            title="Import party data from JSON"
                        >
                            📤 Import
                        </button>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '0'
                }}>
                    <button
                        onClick={() => setActiveTab('user')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: activeTab === 'user' ? '#2a5a2a' : '#252525',
                            color: '#fff',
                            border: activeTab === 'user' ? '2px solid #357535' : '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'user' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'user') e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'user') e.currentTarget.style.backgroundColor = '#252525';
                        }}
                    >
                        👤 User
                    </button>
                    <button
                        onClick={() => setActiveTab('party')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: activeTab === 'party' ? '#2a5a2a' : '#252525',
                            color: '#fff',
                            border: activeTab === 'party' ? '2px solid #357535' : '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'party' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'party') e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'party') e.currentTarget.style.backgroundColor = '#252525';
                        }}
                    >
                        👥 Party
                    </button>
                    <button
                        onClick={() => setActiveTab('quests')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: activeTab === 'quests' ? '#2a5a2a' : '#252525',
                            color: '#fff',
                            border: activeTab === 'quests' ? '2px solid #357535' : '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'quests' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'quests') e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'quests') e.currentTarget.style.backgroundColor = '#252525';
                        }}
                    >
                        📜 Quests
                    </button>
                    <button
                        onClick={() => setActiveTab('world')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: activeTab === 'world' ? '#2a5a2a' : '#252525',
                            color: '#fff',
                            border: activeTab === 'world' ? '2px solid #357535' : '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'world' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (activeTab !== 'world') e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                        onMouseOut={(e) => {
                            if (activeTab !== 'world') e.currentTarget.style.backgroundColor = '#252525';
                        }}
                    >
                        🌍 World
                    </button>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTab === 'user' && (
                    <UserTab
                        userCharacter={partyData.userCharacter}
                        updateUserCharacter={updateUserCharacter}
                        estimateTokens={estimateTokens}
                        copyToClipboard={copyToClipboard}
                    />
                )}

                {activeTab === 'party' && (
                    <PartyTab
                        members={partyData.members}
                        addMember={addMember}
                        removeMember={removeMember}
                        updateMember={updateMember}
                        estimateTokens={estimateTokens}
                        copyToClipboard={copyToClipboard}
                        generateId={generateId}
                    />
                )}

                {activeTab === 'quests' && (
                    <QuestsTab
                        quests={partyData.quests}
                        addQuest={addQuest}
                        removeQuest={removeQuest}
                        updateQuest={updateQuest}
                        estimateTokens={estimateTokens}
                        copyToClipboard={copyToClipboard}
                        generateId={generateId}
                    />
                )}

                {activeTab === 'world' && (
                    <WorldTab
                        world={partyData.world}
                        updateWorld={updateWorld}
                        estimateTokens={estimateTokens}
                        copyToClipboard={copyToClipboard}
                        generateId={generateId}
                    />
                )}
            </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}
                onClick={() => setShowExportModal(false)}
            >
                <div
                    style={{
                        backgroundColor: '#1a1a1a',
                        border: '2px solid #444',
                        borderRadius: '8px',
                        padding: '24px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                            📥 Export Party Data
                        </h3>
                        <button
                            onClick={() => setShowExportModal(false)}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#999',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '24px',
                                padding: '4px 8px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                        >
                            ×
                        </button>
                    </div>
                    
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#aaa' }}>
                        Copy this JSON and save it to a file (e.g., party-backup.json)
                    </p>

                    <textarea
                        readOnly
                        value={JSON.stringify(partyData, null, 2)}
                        style={{
                            flex: 1,
                            backgroundColor: '#252525',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '12px',
                            color: '#e0e0e0',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            resize: 'none',
                            marginBottom: '12px',
                            minHeight: '300px'
                        }}
                    />

                    <button
                        onClick={() => {
                            copyToClipboard(JSON.stringify(partyData, null, 2));
                            setCopyFeedback(true);
                            setTimeout(() => setCopyFeedback(false), 2000);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: copyFeedback ? '#2a5a2a' : '#2a3a5a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                        onMouseOver={(e) => {
                            if (!copyFeedback) e.currentTarget.style.backgroundColor = '#354a75';
                        }}
                        onMouseOut={(e) => {
                            if (!copyFeedback) e.currentTarget.style.backgroundColor = '#2a3a5a';
                        }}
                    >
                        {copyFeedback ? '✅ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                </div>
            </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}
                onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                }}
            >
                <div
                    style={{
                        backgroundColor: '#1a1a1a',
                        border: '2px solid #444',
                        borderRadius: '8px',
                        padding: '24px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                            📤 Import Party Data
                        </h3>
                        <button
                            onClick={() => {
                                setShowImportModal(false);
                                setImportText('');
                            }}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#999',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '24px',
                                padding: '4px 8px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                        >
                            ×
                        </button>
                    </div>
                    
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#aaa' }}>
                        Paste your exported JSON data below
                    </p>

                    <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder='{\n  "members": [...],\n  "userCharacter": {...}\n}'
                        style={{
                            flex: 1,
                            backgroundColor: '#252525',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '12px',
                            color: '#e0e0e0',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            resize: 'none',
                            marginBottom: '12px',
                            minHeight: '300px'
                        }}
                    />

                    <button
                        onClick={importData}
                        disabled={!importText.trim()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: importText.trim() ? '#2a5a2a' : '#333',
                            color: importText.trim() ? '#fff' : '#666',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: importText.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                        onMouseOver={(e) => {
                            if (importText.trim()) e.currentTarget.style.backgroundColor = '#357535';
                        }}
                        onMouseOut={(e) => {
                            if (importText.trim()) e.currentTarget.style.backgroundColor = '#2a5a2a';
                        }}
                    >
                        ✅ Import Data
                    </button>
                </div>
            </div>
        )}
        </>
    );
}
