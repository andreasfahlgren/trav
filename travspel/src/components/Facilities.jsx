import React from 'react';
import { useGameState } from '../context/GameStateContext';

function VisualFarm({ facility }) {
    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '250px', 
            backgroundColor: '#2e4930', 
            borderRadius: '12px', 
            overflow: 'hidden',
            marginBottom: '2rem',
            border: '2px solid var(--border)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
            {/* Dirt base / stable area */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '140px', height: '110px', backgroundColor: '#5c4033', borderRadius: '10px' }} />
            
            {/* Stable */}
            <div style={{ 
                position: 'absolute', 
                top: '30px', left: '30px', 
                width: `${70 + (facility.boxes - 3) * 10}px`, 
                height: '90px', 
                backgroundColor: '#8b5a2b', 
                border: '2px solid #3e2723', 
                borderRadius: '4px',
                transition: 'width 0.5s ease'
            }}>
                 <div style={{ width: '100%', height: '25px', backgroundColor: '#6d4c41', borderBottom: '2px solid #3e2723' }} />
                 <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '15px', fontWeight: 'bold' }}>
                    Stall<br/>({facility.boxes} Boxar)
                 </div>
            </div>

            {/* Oval Track */}
            {facility.upgrades.ovalTrack && (
                <div style={{ 
                    position: 'absolute', top: '20px', right: '40px', 
                    width: '300px', height: '120px', 
                    border: '18px solid #d2b48c', 
                    borderRadius: '100px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2), 0 0 10px rgba(0,0,0,0.2)'
                }} />
            )}

            {/* Pool */}
            {facility.upgrades.pool && (
                <div style={{ 
                    position: 'absolute', top: '150px', left: '20px', 
                    width: '90px', height: '50px', 
                    backgroundColor: '#4fc3f7', border: '4px solid #0288d1', borderRadius: '25px', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>🏊</span>
                </div>
            )}

            {/* Walker */}
            {facility.upgrades.walker && (
                <div style={{ 
                    position: 'absolute', top: '140px', left: '130px', 
                    width: '60px', height: '60px', 
                    borderRadius: '50%', border: '4px solid #757575', backgroundColor: '#9e9e9e', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#424242', borderRadius: '50%', zIndex: 2 }} />
                    <div className="walker-spin" style={{ position: 'absolute', width: '50px', height: '4px', backgroundColor: '#424242' }} />
                    <div className="walker-spin" style={{ position: 'absolute', width: '4px', height: '50px', backgroundColor: '#424242' }} />
                </div>
            )}

            {/* Forest */}
            {facility.upgrades.forestRoad && (
                <div style={{ position: 'absolute', top: '150px', right: '120px', fontSize: '2.5rem', display: 'flex', gap: '5px' }}>
                    🌲🌲
                    <div style={{ position: 'absolute', top: '20px', right: '-40px', fontSize: '2rem' }}>🌲🌲🌲</div>
                </div>
            )}

            {/* Straight Track */}
            {facility.upgrades.straightTrack && (
                <div style={{ 
                    position: 'absolute', bottom: '15px', left: '20px', right: '20px', 
                    height: '24px', backgroundColor: '#d2b48c', 
                    borderTop: '2px dashed rgba(255,255,255,0.5)', borderBottom: '2px dashed rgba(255,255,255,0.5)' 
                }} />
            )}
            
            {!Object.values(facility.upgrades).some(Boolean) && (
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Köp uppgraderingar för att bygga ut anläggningen...
                </div>
            )}
        </div>
    );
}

export function Facilities() {
    const { state, dispatch, formatMoney, showToast } = useGameState();

    const facility = state.facility || {
        boxes: 3,
        upgrades: { ovalTrack: false, straightTrack: false, forestRoad: false, walker: false, pool: false }
    };

    const horsesCount = state.myHorses.length;

    const upgradesList = [
        { id: 'ovalTrack', name: 'Travbana (Oval)', cost: 150000, desc: 'Ger en bra Allround-bonus på träning och håller uppe dagsformen smidigt.', icon: '⭕' },
        { id: 'straightTrack', name: 'Rakbana', cost: 200000, desc: 'Perfekt för intervaller. Ökar träningseffekten på Snabbhet, Sprint och Start!', icon: '📏' },
        { id: 'forestRoad', name: 'Skogsväg', cost: 150000, desc: 'Kuperad terräng som bygger enorm Uthållighet vid tung träning.', icon: '🌲' },
        { id: 'walker', name: 'Skrittmaskin', cost: 75000, desc: 'Håller hästarna i passiv rörelse vilket ger en stabil bas-ökning på dagsformen varje månad.', icon: '⚙️' },
        { id: 'pool', name: 'Simbassäng', cost: 250000, desc: 'Otroligt skonsam träning för hela kroppen. Boostar både speed och stamina-träning!', icon: '🏊' }
    ];

    const handleBoxUpgrade = () => {
        if (state.balance < 100000) {
            showToast('Du har inte tillräckligt med pengar.', 'error');
            return;
        }
        dispatch({ type: 'UPGRADE_BOXES' });
    };

    const handleBuyUpgrade = (upgradeId, cost, name) => {
        if (state.balance < cost) {
            showToast('Du har inte tillräckligt med pengar.', 'error');
            return;
        }
        dispatch({ type: 'BUY_FACILITY_UPGRADE', payload: { upgradeId, cost, name } });
    };

    return (
        <section className="view active">
            <header className="view-header">
                <h2>Träningsanläggning</h2>
                <p>Bygg ut ditt stall och investera i utrustning som boostar dina hästars utveckling!</p>
            </header>

            <VisualFarm facility={facility} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* STALLET */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🛖 Stallet (<span style={{color: horsesCount >= facility.boxes ? 'var(--accent)' : 'white'}}>{horsesCount}</span> / {facility.boxes} Boxar)
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Här bor dina stjärnor. Behöver du fler hästar? Då måste du snickra fler boxar!
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button 
                                className="btn btn-primary"
                                onClick={handleBoxUpgrade}
                                disabled={state.balance < 100000}
                            >
                                Bygg 2 st Boxar (100 000 kr)
                            </button>
                        </div>
                    </div>
                </div>

                {/* TRÄNINGSSPÅR & MASKINER */}
                <div>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        Träningsslingor & Maskiner
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {upgradesList.map(upg => {
                            const isOwned = facility.upgrades[upg.id];
                            
                            return (
                                <div key={upg.id} style={{ 
                                    padding: '1.5rem', 
                                    background: isOwned ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0,0,0,0.3)', 
                                    border: isOwned ? '1px solid var(--success)' : '1px dashed var(--border)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{upg.icon}</span> 
                                        {upg.name}
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexGrow: 1, margin: '0 0 1rem 0' }}>
                                        {upg.desc}
                                    </p>
                                    
                                    <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                                        {isOwned ? (
                                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Ägd och Aktiv</span>
                                        ) : (
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ width: '100%' }}
                                                onClick={() => handleBuyUpgrade(upg.id, upg.cost, upg.name)}
                                                disabled={state.balance < upg.cost}
                                            >
                                                Köp för {formatMoney(upg.cost)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
