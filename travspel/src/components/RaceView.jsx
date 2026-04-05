import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import { RaceEngine } from '../lib/race';

export function RaceView({ raceId, onFinishCurrentView }) {
    const { state, dispatch, showToast, formatMoney } = useGameState();
    const trackRef = useRef(null);
    
    const [simData, setSimData] = useState(null);
    const [positions, setPositions] = useState([]);
    const [raceStatus, setRaceStatus] = useState('idle'); // idle, running, finished
    const [results, setResults] = useState([]);
    
    // Status effect state per horse (e.g., 'galopp')
    const [horseStatuses, setHorseStatuses] = useState([]);

    useEffect(() => {
        const race = state.races.find(r => r.id === raceId);
        if (!race) {
            onFinishCurrentView();
            return;
        }

        const myHorseId = race.enrolled;
        const myHorse = state.myHorses.find(h => h.id === myHorseId);
        
        const data = RaceEngine.setupRaceSimulation(race, myHorse);
        setSimData(data);
        setPositions(new Array(data.competitors.length).fill(0));
        setHorseStatuses(new Array(data.competitors.length).fill(null));
    }, [raceId, state.races, state.myHorses, onFinishCurrentView]);

    const startRace = () => {
        setRaceStatus('running');
        const trackWidth = trackRef.current ? trackRef.current.offsetWidth - 80 : 800;
        
        const { distance, weather } = simData.race;
        const ticksTotalApprox = distance / 5; // En approximation för hur många ticks loppet tar

        // Initial setup for runners
        const runners = simData.competitors.map((h, i) => {
            const formMod = h.form / 100;

            // Base Power factors in basic stats
            let basePower = (h.stats.speed * 1.5 + h.stats.startspeed * 0.5) * formMod;

            // Weather modifier
            let weatherBonus = 1.0;
            if (weather.heavyTrackMod > 0) {
                // The higher the heavyTrack stat, the better they perform in rain compared to others
                weatherBonus = 0.8 + ((h.stats.heavyTrack / 100) * 0.4); 
            } else if (weather.winterTrackMod > 0) {
                weatherBonus = 0.8 + ((h.stats.winterTrack / 100) * 0.4);
            }
            basePower *= weatherBonus;

            return {
                id: h.id,
                index: i,
                pos: 0,
                basePower: Math.max(10, basePower),
                stamina: h.stats.stamina,
                sprint: h.stats.sprint,
                galopprisk: h.stats.galopprisk,
                energy: 100, // Starts at 100%
                isDisqualified: false,
                isGalloping: false,
                gallopTicksLeft: 0,
                status: null
            };
        });

        let currentRunners = [...runners];
        let tick = 0;
        
        const interval = setInterval(() => {
            let anyFinished = false;
            tick++;
            
            // Calculate progress 0.0 to 1.0 based on leader
            const maxPos = Math.max(...currentRunners.map(r => r.pos));
            const progress = maxPos / trackWidth;

            currentRunners.forEach(runner => {
                if (runner.isDisqualified) return;

                // --- Galopp Logic ---
                if (runner.isGalloping) {
                    runner.gallopTicksLeft--;
                    runner.pos += (runner.basePower / 100); // Very slow while galloping
                    if (runner.gallopTicksLeft <= 0) {
                        runner.isGalloping = false;
                        runner.status = null;
                    } else if (runner.gallopTicksLeft > 30) {
                        // Extended gallop can lead to disqualification
                        if (Math.random() < 0.01) {
                            runner.isDisqualified = true;
                            runner.status = "DISKAD";
                        }
                    }
                } else {
                    // Risk of starting to gallop (risk is 1-100, but happens rarely per tick)
                    // High risk = 40. 40 / 10000 = 0.4% chance per tick.
                    const galoppChance = (runner.galopprisk / 15000) * (1.5 - (runner.energy/100)); // Higher risk when tired
                    if (Math.random() < galoppChance) {
                        runner.isGalloping = true;
                        runner.gallopTicksLeft = 10 + Math.floor(Math.random() * 40); // 10-50 ticks of galloping
                        runner.status = "GALOPP";
                    } else {
                        // --- Normal Run Logic ---
                        let currentPower = runner.basePower;

                        // Stamina drop-off
                        // Shorter races (1640) burn 100% energy. Longer (2640) burn more if stamina is low.
                        const energyBurnRate = (distance / 2000) * (1.5 - (runner.stamina / 100));
                        runner.energy -= energyBurnRate * 0.05; 

                        if (runner.energy < 20) {
                            currentPower *= 0.6; // Heavy slow down when exhausted
                        } else if (runner.energy < 50) {
                            currentPower *= 0.85; // Minor slow down
                        }

                        // Sprint (Drar tussarna)
                        if (progress > 0.85) {
                            // Boost based on sprint stat (1-100) -> 1.0 to 1.5x speed
                            const sprintMultiplier = 1.0 + (runner.sprint / 200);
                            currentPower *= sprintMultiplier;
                        }

                        let move = (currentPower / 50) + (Math.random() * 1.5);
                        runner.pos = Math.min(runner.pos + move, trackWidth);
                    }
                }

                if (runner.pos >= trackWidth && !runner.isDisqualified) {
                    anyFinished = true;
                }
            });

            setPositions(currentRunners.map(r => r.pos));
            setHorseStatuses(currentRunners.map(r => r.status));

            if (anyFinished) {
                clearInterval(interval);
                handleRaceFinish(currentRunners);
            }
        }, 50);
    };

    const handleRaceFinish = (endedRunners) => {
        setRaceStatus('finished');
        
        // Match back to competitors and sort
        const comps = simData.competitors.map((c, i) => {
            const runnerData = endedRunners[i];
            return {
                ...c,
                _finishPos: runnerData.isDisqualified ? -1 : runnerData.pos,
                _status: runnerData.status
            };
        });
        
        comps.sort((a,b) => b._finishPos - a._finishPos);
        setResults(comps);

        const playerHorse = comps.find(c => !c.isBot);
        const playerRank = comps.indexOf(playerHorse) + 1;

        if (playerHorse._finishPos === -1) {
            showToast(`Din häst blev diskvalificerad för galopp. Tråkigt!`, 'error');
            dispatch({ 
                type: 'UPDATE_HORSE_STATS', 
                payload: { id: playerHorse.id, wins: 0, earnings: 0, pos: 0, raceName: simData.race.name, distance: simData.race.distance } 
            });
        }
        else if (playerRank === 1) {
            dispatch({ type: 'ADD_MONEY', payload: simData.race.firstPrize });
            showToast(`👑 Din häst VANN! Du drar in ${formatMoney(simData.race.firstPrize)}!`, 'success');
            
            dispatch({ 
                type: 'UPDATE_HORSE_STATS', 
                payload: { id: playerHorse.id, wins: 1, earnings: simData.race.firstPrize, pos: 1, raceName: simData.race.name, distance: simData.race.distance } 
            });
        } else {
            showToast(`Din häst slutade på plats ${playerRank}. Bättre lycka nästa gång!`, 'error');
            dispatch({ 
                type: 'UPDATE_HORSE_STATS', 
                payload: { id: playerHorse.id, wins: 0, earnings: 0, pos: playerRank, raceName: simData.race.name, distance: simData.race.distance } 
            });
        }
    };

    const goBack = () => {
        dispatch({ type: 'REMOVE_RACE', payload: raceId });
        onFinishCurrentView();
    };

    if (!simData) return <div className="view active"><h2 style={{color: 'white'}}>Laddar lopp...</h2></div>;

    return (
        <section className="view active">
            <header className="view-header">
                <h2>{simData.race.track} - {simData.race.name}</h2>
                <p>
                    Distans: {simData.race.distance}m | {simData.race.weather.label} <br/>
                    {raceStatus === 'idle' && 'Väntar på start...'}
                    {raceStatus === 'running' && 'Loppet pågår!'}
                    {raceStatus === 'finished' && 'Loppet är över!'}
                </p>
            </header>

            <div className={`track-container ${simData.race.weather.type}`} ref={trackRef}>
                <div className="finish-line"></div>
                {simData.competitors.map((horse, index) => (
                    <div className="track-line" key={index}>
                        <div 
                            className="horse-racer" 
                            style={{
                                left: `${positions[index] || 0}px`,
                                backgroundColor: horseStatuses[index] === 'DISKAD' ? 'var(--accent)' : (!horse.isBot ? 'var(--success)' : 'var(--primary)'),
                                color: !horse.isBot ? '#fff' : '#000',
                                opacity: horseStatuses[index] === 'DISKAD' ? 0.5 : 1
                            }}
                        >
                            {index + 1}
                            <span className="horse-racer-name">
                                {horse.name} {horseStatuses[index] ? <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>[{horseStatuses[index]}]</span> : ''}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="race-controls">
                {raceStatus === 'idle' && (
                    <button className="btn btn-primary" onClick={startRace}>Starta Loppet!</button>
                )}
                {raceStatus === 'finished' && (
                    <button className="btn" onClick={goBack}>Tillbaka till Tävlingskalender</button>
                )}
            </div>

            {raceStatus === 'finished' && (
                <div className="race-results" style={{ display: 'block', marginTop: '2rem' }}>
                    <h3 style={{ color: 'white', marginBottom: '1rem'}}>Resultat</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {results.map((c, i) => (
                            <li 
                                key={i}
                                style={{
                                    padding: '0.5rem 0',
                                    borderBottom: '1px solid var(--border)',
                                    color: c._finishPos === -1 ? 'var(--accent)' : (!c.isBot ? 'var(--success)' : 'var(--text-muted)'),
                                    fontWeight: !c.isBot ? 'bold' : 'normal',
                                    textDecoration: c._finishPos === -1 ? 'line-through' : 'none'
                                }}
                            >
                                {c._finishPos === -1 ? 'DISKAD' : `${i + 1}.`} {c.name} {c._status === 'DISKAD' ? '(Galopp)' : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
