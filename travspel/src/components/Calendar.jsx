import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';

export function Calendar({ onStartRace }) {
    const { state, dispatch, showToast, formatMoney } = useGameState();
    const [selectedRace, setSelectedRace] = useState(null);
    const [selectedHorse, setSelectedHorse] = useState('');

    const openEnrollModal = (race) => {
        setSelectedRace(race);
        if (state.myHorses.length > 0) {
            setSelectedHorse(state.myHorses[0].id);
        }
    };

    const confirmEnroll = () => {
        if (!selectedHorse) return;

        if (state.balance >= selectedRace.entryFee) {
            dispatch({
                type: 'ENROLL_RACE',
                payload: { raceId: selectedRace.id, horseId: selectedHorse, fee: selectedRace.entryFee }
            });
            showToast(`Du anmälde hästen till ${selectedRace.name}!`);
            setSelectedRace(null);
        } else {
            showToast(`Du har inte råd med anmälningsavgiften!`, 'error');
        }
    };

    return (
        <section className="view active">
            <header className="view-header">
                <h2>Tävlingskalender</h2>
                <p>Anmäl dina hästar till kommande lopp.</p>
            </header>

            <div className="races-list">
                {state.races.length === 0 ? (
                    <div className="empty-state">Inga lopp schemalagda. Gå vidare en månad.</div>
                ) : (
                    state.races.map(race => {
                        const isEnrolled = race.enrolled !== null;
                        const btnState = (isEnrolled || state.myHorses.length === 0);
                        const btnText = isEnrolled ? 'Anmäld' : `Anmäl (${formatMoney(race.entryFee)})`;
                        
                        let enrolledHorseName = "";
                        if (isEnrolled) {
                            const h = state.myHorses.find(h => h.id === race.enrolled);
                            enrolledHorseName = h ? h.name : '';
                        }

                        return (
                            <div key={race.id} className={`card ${isEnrolled ? 'enrolled' : ''}`} style={isEnrolled ? { borderColor: 'var(--primary)' } : {}}>
                                <div className="card-header">
                                    <div>
                                        <h3 className="card-title">{race.name}</h3>
                                        <span className="card-subtitle">Bana: {race.track}</span>
                                        <span className="card-subtitle" style={{display: 'block', marginTop: '0.2rem'}}>
                                            Distans: {race.distance}m | {race.weather.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="horse-stats">
                                    <div className="stat-box">
                                        <span className="stat-label">Förstapris</span>
                                        <span className="stat-value" style={{ color: 'var(--primary)' }}>{formatMoney(race.firstPrize)}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Svårighet</span>
                                        <span className="stat-value">{race.difficulty}/100</span>
                                    </div>
                                </div>
                                {isEnrolled && enrolledHorseName && (
                                    <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        Du tävlar med: {enrolledHorseName}
                                    </p>
                                )}
                                <div style={{ marginTop: '1rem' }}>
                                    <button 
                                        className="btn" 
                                        disabled={btnState}
                                        onClick={() => openEnrollModal(race)}
                                    >
                                        {btnText}
                                    </button>
                                    {isEnrolled && (
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ marginTop: '0.5rem' }}
                                            onClick={() => onStartRace(race)}
                                        >
                                            Starta Loppet!
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                <div className="card" style={{ justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '2px dashed var(--border)' }}>
                    <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Nästa månad</h3>
                    <button 
                        className="btn" 
                        onClick={() => {
                            dispatch({ type: 'ADVANCE_MONTH' });
                            showToast('En månad har passerat.', 'success');
                        }}
                    >
                        Spola fram tiden
                    </button>
                </div>
            </div>

            {/* Modal */}
            <div className={`modal-overlay ${selectedRace ? 'active' : ''}`}>
                <div className="modal">
                    <header className="modal-header">
                        <h3>Anmäl till lopp</h3>
                        <button className="close-modal" onClick={() => setSelectedRace(null)}>&times;</button>
                    </header>
                    <div className="modal-body">
                        {selectedRace && (
                            <>
                                <p>Anmäl till {selectedRace.name}. Avgift: {formatMoney(selectedRace.entryFee)}</p>
                                <div className="form-group">
                                    <label>Välj Häst</label>
                                    <select 
                                        value={selectedHorse} 
                                        onChange={(e) => setSelectedHorse(e.target.value)}
                                    >
                                        {state.myHorses.map(h => (
                                            <option key={h.id} value={h.id}>{h.name} (Form: {h.form}%)</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <footer className="modal-footer">
                        <button className="btn" onClick={() => setSelectedRace(null)}>Avbryt</button>
                        <button className="btn btn-primary" onClick={confirmEnroll}>Anmäl</button>
                    </footer>
                </div>
            </div>
        </section>
    );
}
