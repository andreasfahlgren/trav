import { MarketManager } from './market';

export const TRACKS = [
    { name: 'Solvalla', defaultPrize: 50000, difficulty: 70 },
    { name: 'Jägersro', defaultPrize: 30000, difficulty: 50 },
    { name: 'Åby', defaultPrize: 40000, difficulty: 60 },
    { name: 'Bergsåker', defaultPrize: 25000, difficulty: 40 },
    { name: 'Mantorp', defaultPrize: 15000, difficulty: 30 }
];

export const RACE_NAMES = [
    "Svenskt Travderby", "Elitloppet", "Olympiatravet", "Sprintermästaren",
    "Hugo Åbergs Memorial", "Gulddivisionen", "Silverdivisionen", "Bronsdivisionen",
    "Klass I", "Klass II"
];

export const DISTANCES = [1640, 2140, 2640, 3140];
export const WEATHERS = [
    { type: 'perfect', label: 'Perfekt väder', heavyTrackMod: 0, winterTrackMod: 0 },
    { type: 'rain', label: 'Regn och tung bana', heavyTrackMod: 1, winterTrackMod: 0 },
    { type: 'winter', label: 'Vinterbana (Snö/Is)', heavyTrackMod: 0, winterTrackMod: 1 }
];

export class RaceEngine {
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static generateRaces(count = 3, settings = null) {
        const diffSettingMod = settings ? settings.raceDifficultyModifier : 0;
        const prizeMultiplier = settings ? settings.prizeMultiplier : 1.0;

        const races = [];
        for (let i = 0; i < count; i++) {
            const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
            const name = RACE_NAMES[Math.floor(Math.random() * RACE_NAMES.length)];
            const distance = DISTANCES[Math.floor(Math.random() * DISTANCES.length)];
            const weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
            
            // Randomize difficulty slightly from track default
            const diffMod = (Math.random() * 20) - 10 + diffSettingMod;
            const difficulty = Math.max(10, Math.min(100, Math.floor(track.difficulty + diffMod)));
            
            const firstPrizeBase = Math.floor(track.defaultPrize * (difficulty / 50));
            const firstPrize = Math.floor(firstPrizeBase * prizeMultiplier);
            const entryFee = Math.floor(firstPrize * 0.05);

            races.push({
                id: this.generateId(),
                track: track.name,
                name: name,
                difficulty: difficulty,
                distance: distance,
                weather: weather,
                firstPrize: firstPrize,
                entryFee: entryFee,
                enrolled: null
            });
        }
        return races;
    }

    static setupRaceSimulation(race, playerHorse) {
        // Om motståndet är svårt, generera bättre hästar.
        const oppMinQuality = Math.max(20, race.difficulty - 10);
        const oppMaxQuality = Math.min(90, race.difficulty + 20);

        const competitors = [playerHorse];
        // Generate 7 competitors
        for (let i = 0; i < 7; i++) {
            const opp = MarketManager.generateHorse(oppMinQuality, oppMaxQuality);
            opp.isBot = true;
            competitors.push(opp);
        }

        // Shuffle starting positions
        for (let i = competitors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [competitors[i], competitors[j]] = [competitors[j], competitors[i]];
        }

        return {
            race,
            competitors,
        };
    }
}
