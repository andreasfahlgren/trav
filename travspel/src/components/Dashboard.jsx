import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { HorseDetails } from './HorseDetails';

export function HorseCard({ horse, children }) {
    const { formatMoney } = useGameState();
    
    // Beräkna medelvärde
    const avgTrainable = Math.round((horse.stats.speed + horse.stats.stamina + horse.stats.startspeed + horse.stats.sprint) / 4);

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <h3 className="card-title">{horse.name}</h3>
                    <span className="card-subtitle">Ålder: {horse.age} år | Form: {horse.form}%</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{avgTrainable}</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>MEDEL</span>
                </div>
            </div>
            {/* Vi visar bara ett fåtal stats på kortet, resten finns i detaljvyn */}
            <div className="horse-stats">
                <div className="stat-box">
                    <span className="stat-label">Snabbhet</span>
                    <span className="stat-value">{Math.round(horse.stats.speed)}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Uthållighet</span>
                    <span className="stat-value">{Math.round(horse.stats.stamina)}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Inkört</span>
                    <span className="stat-value">{formatMoney(horse.earnings)}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Galopprisk</span>
                    <span className="stat-value" style={{color: horse.stats.galopprisk > 20 ? 'var(--accent)' : 'inherit'}}>{Math.round(horse.stats.galopprisk)}</span>
                </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    );
}

export function Dashboard() {
    const { state } = useGameState();
    const [selectedHorse, setSelectedHorse] = useState(null);

    return (
        <section className="view active">
            <header className="view-header">
                <h2>Mitt Stall</h2>
                <p>Översikt över din ekonomi och dina hästar.</p>
            </header>
            
            <div className="horses-grid">
                {state.myHorses.length === 0 ? (
                    <div className="empty-state">
                        Du äger inga hästar ännu. Gå till Hästauktionen för att köpa din första travare!
                    </div>
                ) : (
                    state.myHorses.map(horse => (
                        <HorseCard key={horse.id} horse={horse}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                <button className="btn" onClick={() => setSelectedHorse(horse)}>Visa Detaljer</button>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Lopp satta: {horse.races} | Vinster: {horse.wins}
                                </p>
                            </div>
                        </HorseCard>
                    ))
                )}
            </div>

            {selectedHorse && (
                <HorseDetails 
                    initialHorse={selectedHorse} 
                    viewType="dashboard" 
                    onClose={() => setSelectedHorse(null)} 
                />
            )}
        </section>
    );
}
