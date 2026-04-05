import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Market } from './components/Market';
import { Calendar } from './components/Calendar';
import { RaceView } from './components/RaceView';
import { Facilities } from './components/Facilities';
import { AdminSettings } from './components/AdminSettings';
import { useGameState } from './context/GameStateContext';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [activeRaceId, setActiveRaceId] = useState(null);
    const { state } = useGameState();

    const handleStartRace = (race) => {
        setActiveRaceId(race.id);
        setCurrentView('race');
    };

    const handleRaceFinished = () => {
        setActiveRaceId(null);
        setCurrentView('calendar');
    };

    return (
        <div id="app">
            <Sidebar currentView={currentView} setView={setCurrentView} />
            
            <main className="content">
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'facility' && <Facilities />}
                {currentView === 'market' && <Market />}
                {currentView === 'calendar' && <Calendar onStartRace={handleStartRace} />}
                {currentView === 'admin' && <AdminSettings />}
                {currentView === 'race' && activeRaceId && (
                    <RaceView 
                        raceId={activeRaceId} 
                        onFinishCurrentView={handleRaceFinished} 
                    />
                )}
            </main>

            {/* Toast System */}
            <div id="toast-container" className="toast-container">
                {state.toast && (
                    <div className={`toast ${state.toast.type}`}>
                        <p>{state.toast.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
