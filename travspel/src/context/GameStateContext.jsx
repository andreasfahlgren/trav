import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { MarketManager } from '../lib/market';
import { RaceEngine } from '../lib/race';

const GameStateContext = createContext();

const initialState = {
    balance: 100000,
    month: 1,
    year: 1,
    myHorses: [],
    marketHorses: [],
    races: [],
    facility: {
        boxes: 3,
        upgrades: {
            ovalTrack: false,
            straightTrack: false,
            forestRoad: false,
            walker: false,
            pool: false
        }
    },
    toast: null, // { message, type }
    settings: {
        trainingMultiplier: 1.0,
        minHorseQuality: 30,
        maxHorseQuality: 90,
        raceDifficultyModifier: 0,
        prizeMultiplier: 1.0
    }
};

export const MONTHS = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

function gameReducer(state, action) {
    switch (action.type) {
        case 'LOAD_STATE':
            return { ...state, ...action.payload };
        
        case 'ADD_MONEY':
            return { ...state, balance: state.balance + action.payload };

        case 'REMOVE_MONEY':
            if (state.balance >= action.payload) {
                return { ...state, balance: state.balance - action.payload };
            }
            return state;

        case 'BUY_HORSE': {
            const horseToBuy = state.marketHorses.find(h => h.id === action.payload);
            // Check if stable is full
            const maxBoxes = (state.facility && state.facility.boxes) ? state.facility.boxes : 3;
            if (state.myHorses.length >= maxBoxes) {
                return { ...state, toast: { message: `Stallet är fullt! Du måste bygga fler boxar.`, type: 'error' } };
            }

            if (!horseToBuy || state.balance < horseToBuy.price) return state;
            
            return {
                ...state,
                balance: state.balance - horseToBuy.price,
                marketHorses: state.marketHorses.filter(h => h.id !== action.payload),
                myHorses: [...state.myHorses, horseToBuy]
            };
        }

        case 'ENROLL_RACE':
            return {
                ...state,
                balance: state.balance - action.payload.fee,
                races: state.races.map(r => 
                    r.id === action.payload.raceId ? { ...r, enrolled: action.payload.horseId } : r
                )
            };

        case 'REMOVE_RACE':
            return {
                ...state,
                races: state.races.filter(r => r.id !== action.payload)
            };

        case 'UPGRADE_BOXES': {
            const cost = 100000;
            if (state.balance < cost) return state;
            return {
                ...state,
                balance: state.balance - cost,
                facility: {
                    ...state.facility,
                    boxes: state.facility.boxes + 2
                },
                toast: { message: `Stallet utkbyggt med 2 nya boxar!`, type: 'success' }
            };
        }

        case 'BUY_FACILITY_UPGRADE': {
            const { upgradeId, cost, name } = action.payload;
            if (state.balance < cost || state.facility.upgrades[upgradeId]) return state;
            return {
                ...state,
                balance: state.balance - cost,
                facility: {
                    ...state.facility,
                    upgrades: {
                        ...state.facility.upgrades,
                        [upgradeId]: true
                    }
                },
                toast: { message: `Klar! Du har byggt: ${name}`, type: 'success' }
            };
        }

        case 'UPDATE_HORSE_STATS':
            return {
                ...state,
                myHorses: state.myHorses.map(h => 
                    h.id === action.payload.id 
                    ? { 
                        ...h, 
                        wins: h.wins + action.payload.wins, 
                        races: h.races + 1, 
                        earnings: h.earnings + action.payload.earnings,
                        seasonEarnings: (h.seasonEarnings || 0) + action.payload.earnings,
                        history: [{ 
                            pos: action.payload.pos, 
                            prize: action.payload.earnings,
                            raceName: action.payload.raceName || 'Okänt Lopp',
                            distance: action.payload.distance || 0
                        }, ...(h.history || [])].slice(0, 50)
                      } 
                    : h
                )
            };

        case 'SET_TRAINING_FOCUS':
            return {
                ...state,
                myHorses: state.myHorses.map(h =>
                    h.id === action.payload.id
                    ? { ...h, trainingFocus: action.payload.focus }
                    : h
                ),
                toast: { message: `Träningsfokus uppdaterat.`, type: 'success' }
            };

        case 'ADVANCE_MONTH': {
            let newMonth = state.month + 1;
            let newYear = state.year;
            if (newMonth > 12) {
                newMonth = 1;
                newYear += 1;
            }

            // Training Engine
            const trainedHorses = state.myHorses.map(horse => {
                let updatedHorse = { ...horse };
                // Apply Training
                // The amount of potential training points gained is based on trainability
                let baseTrainingPower = (updatedHorse.stats.trainability / 100) * (Math.random() * 2 + 0.5); // 0 to ~2.5 points max
                let trainingPower = baseTrainingPower * (state.settings?.trainingMultiplier || 1.0);

                const upg = state.facility?.upgrades || {};
                let formBoost = 0;
                
                // Form bonuses from passive facilities
                if (upg.walker) formBoost += 2; // Skrittmaskin keeps horses moving
                if (upg.ovalTrack) formBoost += 1; // Travbana easy access
                
                let newForm = horse.form + (Math.random() * 20 - 10) + formBoost;
                if (newForm > 100) newForm = 100;
                if (newForm < 1) newForm = 1;
                updatedHorse.form = Math.floor(newForm);

                // Yearly age up
                if (newMonth === 1) {
                    updatedHorse.age += 1;
                    updatedHorse.seasonEarnings = 0;
                    // Trainability drops as they age
                    updatedHorse.stats.trainability = Math.max(1, updatedHorse.stats.trainability - (Math.random() * 10 + 5));
                }

                // Target stat depends on focus
                const targets = [];
                let focusBonus = 1.0;

                if (updatedHorse.trainingFocus === 'speed') {
                    targets.push('speed', 'sprint');
                    if (upg.straightTrack) focusBonus += 0.3; // 30% more effective speed training
                    if (upg.pool) focusBonus += 0.15;
                }
                else if (updatedHorse.trainingFocus === 'stamina') {
                    targets.push('stamina');
                    if (upg.forestRoad) focusBonus += 0.3;
                    if (upg.pool) focusBonus += 0.15;
                }
                else if (updatedHorse.trainingFocus === 'start') {
                    targets.push('startspeed');
                    if (upg.straightTrack) focusBonus += 0.15;
                }
                else {
                    targets.push('speed', 'stamina', 'startspeed', 'sprint'); // allround
                    if (upg.ovalTrack) focusBonus += 0.2; // 20% allround boost
                }

                trainingPower *= focusBonus;

                // Distribute power among targets
                const powerPerTarget = trainingPower / targets.length;

                targets.forEach(statName => {
                    const currentVal = updatedHorse.stats[statName];
                    const talent = updatedHorse.stats.talent;
                    
                    // The closer the stat is to the talent cap, the harder it is to train
                    const gapToCap = talent - currentVal;
                    let actualGrowth = 0;

                    if (gapToCap > 0) {
                        // Easy growth if far from cap
                        actualGrowth = powerPerTarget * Math.min(1, gapToCap / 20); // Scaled growth
                    } else {
                        // Very slow growth if above talent (diminishing returns)
                        actualGrowth = powerPerTarget * 0.1; 
                    }

                    // Apply and clamp
                    let newVal = currentVal + actualGrowth;
                    if (newVal > 100) newVal = 100;
                    updatedHorse.stats[statName] = newVal;
                });

                return updatedHorse;
            });

            return {
                ...state,
                month: newMonth,
                year: newYear,
                marketHorses: MarketManager.generateMarketList(6, state.settings),
                races: RaceEngine.generateRaces(3, state.settings),
                myHorses: trainedHorses,
                toast: { message: `En månad har passerat. Hästarna har tränats!`, type: 'success' }
            };
        }

        case 'UPDATE_SETTINGS':
            return { ...state, settings: action.payload };

        case 'SHOW_TOAST':
            return { ...state, toast: action.payload };
            
        case 'HIDE_TOAST':
            return { ...state, toast: null };

        case 'INITIALIZE_GAME':
            return {
                ...initialState,
                marketHorses: MarketManager.generateMarketList(6, initialState.settings),
                races: RaceEngine.generateRaces(3, initialState.settings)
            };

        default:
            return state;
    }
}

export function GameStateProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState, (initial) => {
        const saved = localStorage.getItem('trav_manager_state');
        if (saved) {
            try {
                const parsedState = JSON.parse(saved);
                
                // MIGRATION / FALLBACK: Fix old horses missing new stats
                const patchedHorses = (parsedState.myHorses || []).map(horse => {
                    return {
                        ...horse,
                        stats: {
                            speed: horse.stats?.speed || 50,
                            stamina: horse.stats?.stamina || 50,
                            startspeed: horse.stats?.startspeed || 50,
                            sprint: horse.stats?.sprint || 50,
                            galopprisk: horse.stats?.galopprisk || 10,
                            heavyTrack: horse.stats?.heavyTrack || 50,
                            winterTrack: horse.stats?.winterTrack || 50,
                            talent: horse.stats?.talent || 50,
                            trainability: horse.stats?.trainability || 50
                        },
                        trainingFocus: horse.trainingFocus || 'allround',
                        seasonEarnings: horse.seasonEarnings || 0,
                        history: horse.history || [],
                        appearance: horse.appearance || { coat: '#4a3c31', mane: '#1a1a1a', marking: 'none', eye: '#1a1a1a' }
                    };
                });
                
                const patchedFacility = parsedState.facility || {
                    boxes: 3,
                    upgrades: {
                        ovalTrack: false,
                        straightTrack: false,
                        forestRoad: false,
                        walker: false,
                        pool: false
                    }
                };
                
                const patchedSettings = parsedState.settings || initial.settings;
                
                return { ...initial, ...parsedState, myHorses: patchedHorses, facility: patchedFacility, settings: patchedSettings };
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }
        // If no saved state or error, initialize game
        return {
            ...initial,
            marketHorses: MarketManager.generateMarketList(6, initial.settings),
            races: RaceEngine.generateRaces(3, initial.settings)
        };
    });

    // Save to local storage on changes
    useEffect(() => {
        if (state.marketHorses.length > 0) { // Don't save empty initial state
            localStorage.setItem('trav_manager_state', JSON.stringify({
                ...state,
                toast: null // Don't save toast state
            }));
        }
    }, [state]);

    const showToast = (message, type = 'success') => {
        dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
        setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <GameStateContext.Provider value={{ state, dispatch, showToast, formatMoney }}>
            {children}
        </GameStateContext.Provider>
    );
}

export function useGameState() {
    return useContext(GameStateContext);
}
