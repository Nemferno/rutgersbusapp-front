
export class Distance {

    public static readonly R = 6371e3;

    public static toRadians(value: number): number {
        return value * Math.PI / 180;
    }

    public static distance(lat: number, lon: number, lat2: number, lon2: number): number {
        const latR = Distance.toRadians(lat);
        const lat2R = Distance.toRadians(lat2);
        const deltaLat = Distance.toRadians(lat2 - lat);
        const deltaLon = Distance.toRadians(lon2 - lon);

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(latR) * Math.cos(lat2R) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Distance.toMiles(Distance.R * c);
    }

    public static toMiles(meters: number): number {
        return meters * 0.000621371;
    }

}
