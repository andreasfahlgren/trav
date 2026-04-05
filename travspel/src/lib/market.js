export const HORSE_FIRST_NAMES = ["Blixten", "Viking", "Shadow", "Starlight", "Thunder", "Pegasus", "Dream", "Spirit", "Mystic", "Champion", "Golden", "Midnight", "Rapid", "Silver", "Iron"];
export const HORSE_LAST_NAMES = ["Boy", "Girl", "Runner", "Star", "King", "Queen", "Legend", "Strike", "Dancer", "Glory", "Hoof", "Wind", "Storm", "Express", "Arrow"];

export class MarketManager {
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static generateHorseName() {
        const first = HORSE_FIRST_NAMES[Math.floor(Math.random() * HORSE_FIRST_NAMES.length)];
        const last = HORSE_LAST_NAMES[Math.floor(Math.random() * HORSE_LAST_NAMES.length)];
        return `${first} ${last}`;
    }

    static generateHorse(minQuality = 30, maxQuality = 80) {
        // Quality factor affects all base stats
        const qualityFactor = minQuality + Math.random() * (maxQuality - minQuality); // 30-80
        
        // Age: 2-8 years (younger means less trained)
        const age = Math.floor(2 + Math.random() * 7); 
        
        // Age modifier on training attributes (A 2 year old is at roughly 40-50% of its potential)
        let ageModifier = 1.0;
        if (age === 2) ageModifier = 0.45;
        else if (age === 3) ageModifier = 0.65;
        else if (age === 4) ageModifier = 0.85;
        else if (age >= 8) ageModifier = 0.90; // Starting to drop off

        const clamp = (val) => Math.max(1, Math.min(100, Math.floor(val)));

        // --- Träningsbara Egenskaper ---
        // These are affected by age Modifier
        const speed = clamp((qualityFactor + (Math.random() * 20 - 10)) * ageModifier);
        const stamina = clamp((qualityFactor + (Math.random() * 20 - 10)) * ageModifier);
        const startspeed = clamp((qualityFactor + (Math.random() * 20 - 10)) * ageModifier);
        const sprint = clamp((qualityFactor + (Math.random() * 20 - 10)) * ageModifier);

        // --- Miljö/Race Egenskaper (Statics) ---
        // Not affected by age directly
        const galopprisk = clamp(Math.random() * 40); // Usually 0-40, sometimes higher on bad horses
        const heavyTrack = clamp(30 + Math.random() * 60);
        const winterTrack = clamp(20 + Math.random() * 70);

        // --- Dolda Egenskaper ---
        const talent = clamp(qualityFactor + (Math.random() * 30 - 15)); // Hidden potential value
        
        // Trainability (hur glad/villig hästen är att träna). Yngre är gladare.
        // Ålder 2 = ca 80-100. Ålder 8 = ca 20-40, men med stor varians.
        const baseTrainability = 110 - (age * 12);
        const trainability = clamp(baseTrainability + (Math.random() * 40 - 20));
        
        const form = Math.floor(50 + Math.random() * 50);

        // --- Utseende (Avatar) ---
        const coatColors = ['#4a3c31', '#2c221b', '#8b5a2b', '#c19a6b', '#1a1a1a', '#e8e8e8', '#d2b48c']; // Brown, Dark Brown, Chestnut, Dun, Black, Grey, Tan
        const maneColors = ['#1a1a1a', '#3e2723', '#212121', '#f5f5f5', '#5d4037'];
        const markings = ['none', 'star', 'stripe', 'blaze', 'snip'];
        const eyeColors = ['#3e2723', '#1a1a1a', '#000000'];

        const appearance = {
            coat: coatColors[Math.floor(Math.random() * coatColors.length)],
            mane: maneColors[Math.floor(Math.random() * maneColors.length)],
            marking: markings[Math.floor(Math.random() * markings.length)],
            eye: eyeColors[Math.floor(Math.random() * eyeColors.length)]
        };

        const horse = {
            id: this.generateId(),
            name: this.generateHorseName(),
            age: age,
            appearance: appearance,
            stats: {
                // Trainable
                speed,
                stamina,
                startspeed,
                sprint,
                // Static / Environment
                galopprisk,
                heavyTrack,
                winterTrack,
                // Hidden
                talent,
                trainability
            },
            trainingFocus: 'allround',
            form: clamp(form),
            wins: 0,
            races: 0,
            earnings: 0,
            seasonEarnings: 0,
            history: [],
        };

        const statSum = horse.stats.speed + horse.stats.stamina + horse.stats.startspeed + horse.stats.sprint;
        const avgStat = statSum / 4;
        
        // Price calculation based heavily on hidden talent (breeding potential) + current average
        let basePrice = Math.pow((avgStat + horse.stats.talent) / 40, 3) * 1000; 
        
        // Age affects market value directly
        let priceAgeModifier = 1;
        if (age <= 3) priceAgeModifier = 1.5; // Young talents are expensive
        else if (age > 6) priceAgeModifier = 0.6; // Old horses drop in value
        
        horse.price = Math.round((basePrice * priceAgeModifier) / 1000) * 1000; 
        if (horse.price < 5000) horse.price = 5000;

        return horse;
    }

    static generateMarketList(count = 5, settings = null) {
        const list = [];
        const minBoundary = settings ? settings.minHorseQuality : 30;
        const maxBoundary = settings ? settings.maxHorseQuality : 90;

        for (let i = 0; i < count; i++) {
            const midPoint = minBoundary + (maxBoundary - minBoundary) * 0.5;
            let currentMin = minBoundary;
            let currentMax = midPoint;
            
            if (Math.random() > 0.8) {
                currentMin = midPoint;
                currentMax = maxBoundary;
            }
            list.push(this.generateHorse(currentMin, currentMax));
        }
        return list;
    }
}
