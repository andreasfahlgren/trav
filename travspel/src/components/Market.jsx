import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { HorseCard } from './Dashboard';
import { HorseDetails } from './HorseDetails';

export function Market() {
    const { state, dispatch, showToast, formatMoney } = useGameState();
    const [selectedHorse, setSelectedHorse] = useState(null);

    const maxBoxes = (state.facility && state.facility.boxes) ? state.facility.boxes : 3;
    const isFull = state.myHorses.length >= maxBoxes;

    const handleBuy = (horse) => {
        if (isFull) {
            showToast(`Stallet är fullt!`, 'error');
            return;
        }

        if (state.balance >= horse.price) {
            dispatch({ type: 'BUY_HORSE', payload: horse.id });
            showToast(`Du köpte ${horse.name} för ${formatMoney(horse.price)}!`);
        } else {
            showToast(`Köp misslyckades. Inte tillräckligt med pengar.`, 'error');
        }
    };

    return (
        <section className="view active">
            <header className="view-header">
                <h2>Hästauktion</h2>
                <p>Här kan du köpa nya förmågor till ditt stall.</p>
            </header>
            
            <div className="market-list">
                {state.marketHorses.length === 0 ? (
                    <div className="empty-state">
                        Auktionen är tom just nu. Ny marknad öppnar nästa månad.
                    </div>
                ) : (
                    state.marketHorses.map(horse => {
                        const canAfford = state.balance >= horse.price;
                        return (
                            <HorseCard key={horse.id} horse={horse}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button 
                                        className="btn" 
                                        onClick={() => setSelectedHorse(horse)}
                                    >
                                        Detaljer
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        disabled={!canAfford || isFull}
                                        onClick={() => handleBuy(horse)}
                                    >
                                        {isFull ? 'Stall Fullt' : (canAfford ? `${formatMoney(horse.price)}` : 'För dyr')}
                                    </button>
                                </div>
                            </HorseCard>
                        );
                    })
                )}
            </div>

            {selectedHorse && (
                <HorseDetails horse={selectedHorse} onClose={() => setSelectedHorse(null)} />
            )}
        </section>
    );
}
