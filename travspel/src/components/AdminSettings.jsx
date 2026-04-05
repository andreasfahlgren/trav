import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';

export function AdminSettings() {
    const { state, dispatch, showToast } = useGameState();
    const [localSettings, setLocalSettings] = useState(state.settings);

    // Sync if global state changes unexpectedly
    useEffect(() => {
        setLocalSettings(state.settings);
    }, [state.settings]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) parsedValue = 0;

        setLocalSettings(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    const handleSave = () => {
        // Validate min/max relation
        let finalSettings = { ...localSettings };
        if (finalSettings.minHorseQuality >= finalSettings.maxHorseQuality) {
            finalSettings.maxHorseQuality = finalSettings.minHorseQuality + 10;
        }

        dispatch({ type: 'UPDATE_SETTINGS', payload: finalSettings });
        showToast("Regelverket har uppdaterats!", "success");
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h2>Regelverk & Inställningar</h2>
                <div className="actions">
                    <button className="btn primary" onClick={handleSave}>Spara Inställningar</button>
                </div>
            </header>

            <div className="dashboard-grid admin-grid">
                <div className="card">
                    <h3>Träning</h3>
                    <div className="setting-group">
                        <label>
                            Träningseffektivitet ({localSettings.trainingMultiplier}x)
                            <p className="hint">Styr hur snabbt hästar utvecklas vid månadsskiften.</p>
                        </label>
                        <input 
                            type="range" 
                            name="trainingMultiplier" 
                            min="0.1" max="5.0" step="0.1" 
                            value={localSettings.trainingMultiplier} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                <div className="card">
                    <h3>Hästauktion (Marknad)</h3>
                    <div className="setting-group">
                        <label>
                            Lägsta Hästkvalitet ({localSettings.minHorseQuality})
                            <p className="hint">Bottennivån på de hästar som genereras till auktionen.</p>
                        </label>
                        <input 
                            type="range" 
                            name="minHorseQuality" 
                            min="10" max="80" step="5" 
                            value={localSettings.minHorseQuality} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="setting-group">
                        <label>
                            Högsta Hästkvalitet ({localSettings.maxHorseQuality})
                            <p className="hint">Toppnivån på de hästar som genereras till auktionen.</p>
                        </label>
                        <input 
                            type="range" 
                            name="maxHorseQuality" 
                            min="40" max="100" step="5" 
                            value={localSettings.maxHorseQuality} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                <div className="card">
                    <h3>Tävlingar & Lopp</h3>
                    <div className="setting-group">
                        <label>
                            Svårighetsgrad Modifierare ({localSettings.raceDifficultyModifier > 0 ? '+' : ''}{localSettings.raceDifficultyModifier})
                            <p className="hint">Gör loppen och motståndet svårare (plus) eller lättare (minus).</p>
                        </label>
                        <input 
                            type="range" 
                            name="raceDifficultyModifier" 
                            min="-30" max="30" step="5" 
                            value={localSettings.raceDifficultyModifier} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div className="setting-group">
                        <label>
                            Prispengar Multiplikator ({localSettings.prizeMultiplier}x)
                            <p className="hint">Förändrar hur mycket prispengar som delas ut i loppen.</p>
                        </label>
                        <input 
                            type="range" 
                            name="prizeMultiplier" 
                            min="0.5" max="5.0" step="0.5" 
                            value={localSettings.prizeMultiplier} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>
            </div>
            
            <style jsx="true">{`
                .admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .setting-group {
                    margin-bottom: 2rem;
                }
                .setting-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--text-color);
                }
                .setting-group .hint {
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    margin-top: 0.25rem;
                    margin-bottom: 0.75rem;
                }
                .setting-group input[type="range"] {
                    width: 100%;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
