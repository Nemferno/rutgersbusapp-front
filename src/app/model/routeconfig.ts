
export class RouteStop {
    stopid: number;
    stopname: string;
    coord: string;
    stopserviceid: string;
}

export class RouteConfiguration {
    routeid: number;
    routename: string;
    routeserviceid: string;
    direction: string;
    stops: RouteStop[];
    segments: string[];
}

export class CompactStop {
    stopid: number;
    stopname: string;
    stopserviceid: string;
    coord: string[];
}
