import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { HorseAvatar } from './HorseAvatar';

export function HorseDetails({ initialHorse, viewType, onClose }) {
    const { state, dispatch, formatMoney } = useGameState();
    const [historyPage, setHistoryPage] = useState(0);
    
    // Hitta alltid den senaste datan från state så vi inte låser oss vid initiala objektet.
    const horse = (viewType === 'market' ? state.marketHorses : state.myHorses).find(h => h.id === initialHorse.id) || initialHorse;

    if (!horse) return null;

    // Beräkna medelvärde av träningsbara egenskaper
    const avgTrainable = Math.round(
        (horse.stats.speed + horse.stats.stamina + horse.stats.startspeed + horse.stats.sprint) / 4
    );

    // Beräkna startpoäng från de senaste 5 loppen
    const startPoints = (horse.history || []).slice(0, 5).reduce((points, result) => {
        let p = Math.floor((result.prize || 0) / 100);
        switch(result.pos) {
            case 1: p += 400; break;
            case 2: p += 200; break;
            case 3: p += 100; break;
            case 4: p += 50; break;
            case 5: p += 25; break;
            default: break;
        }
        return points + p;
    }, 0);

    // Funktion för att rita en snygg progress bar utan decimaler
    const ProgressBar = ({ label, value, color = 'var(--primary)', isNegative = false }) => (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span>{Math.round(value)}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                    style={{ 
                        width: `${value}%`, 
                        height: '100%', 
                        background: isNegative ? 'var(--accent)' : color,
                        transition: 'width 0.3s ease'
                    }} 
                />
            </div>
        </div>
    );

    return (
        <div className="modal-overlay active" style={{ zIndex: 200 }}>
            <div className="modal" style={{ maxWidth: '600px', transform: 'none' }}>
                <header className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', overflow: 'hidden' }}>
                            <HorseAvatar appearance={horse.appearance} size={64} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {horse.name}
                                <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(212, 163, 115, 0.2)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {horse.age} år
                                </span>
                            </h2>
                        </div>
                    </div>
                    <button className="close-modal" onClick={onClose} aria-label="Stäng">&times;</button>
                </header>
                
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    
                    {/* Översikt och Info (2x2 Grid) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-box" style={{ textAlign: 'center' }}>
                            <span className="stat-label" title="Påverkar prestationen markant i nästa lopp.">Dagsform</span>
                            <span className="stat-value" style={{ fontSize: '1.5rem', color: horse.form > 80 ? 'var(--success)' : 'white' }}>{horse.form}%</span>
                        </div>
                        <div className="stat-box" style={{ textAlign: 'center' }}>
                            <span className="stat-label" title="Baseras på placeringar och prispengar från de 5 senaste starterna.">Startpoäng</span>
                            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{startPoints}</span>
                        </div>
                        <div className="stat-box" style={{ textAlign: 'center' }}>
                            <span className="stat-label" title="Ett samlat medelvärde av hästens grundläggande egenskaper.">Medelvärde Egenskaper</span>
                            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{avgTrainable}</span>
                        </div>
                        <div className="stat-box" style={{ textAlign: 'center' }}>
                            <span className="stat-label" title="Summan av allt hästen travat in i hela sitt liv.">Inkört Totalt</span>
                            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{formatMoney(horse.earnings)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Kolumn 1: Träningsbara egenskaper */}
                        <div>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                    Fysiska Egenskaper
                                </h3>
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Träningsfokus</label>
                                <select 
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border)' }}
                                    value={horse.trainingFocus || 'allround'}
                                    onChange={(e) => dispatch({ type: 'SET_TRAINING_FOCUS', payload: { id: horse.id, focus: e.target.value }})}
                                >
                                    <option value="allround">Allround (Jämnt fördelat)</option>
                                    <option value="speed">Intervaller (Snabbhet & Spurt)</option>
                                    <option value="stamina">Tung Vagn (Uthållighet)</option>
                                    <option value="start">Snabba Upplopp (Startsnabbhet)</option>
                                </select>
                            </div>

                            <ProgressBar label="Snabbhet" value={horse.stats.speed} />
                            <ProgressBar label="Uthållighet" value={horse.stats.stamina} />
                            <ProgressBar label="Startsnabbhet" value={horse.stats.startspeed} />
                            <ProgressBar label="Spurt" value={horse.stats.sprint} />
                        </div>

                        {/* Kolumn 2: Miljö och Risk */}
                        <div>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
                                Miljö & Prestation
                            </h3>
                            <ProgressBar label="Galopprisk" value={horse.stats.galopprisk} isNegative={true} />
                            <ProgressBar label="Tung / Blöt Bana" value={horse.stats.heavyTrack} color="#45aaf2" />
                            <ProgressBar label="Vinterbana (Snö/Is)" value={horse.stats.winterTrack} color="#d1d8e0" />
                            
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed var(--border)'}}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Karriär</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span>Starter:</span> <strong>{horse.races}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span>Vinster:</span> <strong style={{color: 'var(--success)'}}>{horse.wins}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span>Inkört Säsong:</span> <strong style={{color: 'var(--primary)'}}>{formatMoney(horse.seasonEarnings || 0)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historik */}
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                Lopphistorik
                            </h3>
                            {horse.history && horse.history.length > 5 && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                        onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                                        disabled={historyPage === 0}
                                    >
                                        &larr; Nyare
                                    </button>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                        Sida {historyPage + 1} av {Math.ceil(horse.history.length / 5)}
                                    </span>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                        onClick={() => setHistoryPage(p => Math.min(Math.ceil(horse.history.length / 5) - 1, p + 1))}
                                        disabled={historyPage >= Math.ceil(horse.history.length / 5) - 1}
                                    >
                                        Äldre &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                        {(!horse.history || horse.history.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Hästen har inte sprungit några lopp ännu.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {horse.history.slice(historyPage * 5, historyPage * 5 + 5).map((race, index) => (
                                    <li key={index} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        padding: '0.5rem', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: index % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent',
                                        fontSize: '0.8rem'
                                    }}>
                                        <div style={{ flex: '1 1 40%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <strong style={{ color: 'white' }} title={race.raceName || 'Okänt Lopp'}>{race.raceName || 'Okänt Lopp'}</strong>
                                        </div>
                                        <div style={{ flex: '0 0 20%', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            {race.distance ? `${race.distance}m` : '-'}
                                        </div>
                                        <div style={{ flex: '0 0 20%', textAlign: 'center' }}>
                                            <strong style={{ color: race.pos === 1 ? 'var(--success)' : (race.pos > 0 ? 'white' : 'var(--accent)') }}>
                                                {race.pos === 0 ? 'd' : race.pos}
                                            </strong>
                                        </div>
                                        <div style={{ flex: '0 0 20%', textAlign: 'right', color: 'var(--primary)' }}>
                                            {formatMoney(race.prize || 0)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Dold attribut för debug / admin. Det kan tas bort om du vill att det ska förbli 100% dolt i UI */}
                    {/* <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)'}}>
                        Dold Talang: {horse.stats.talent}
                    </div> */}

                </div>
            </div>
        </div>
    );
}
