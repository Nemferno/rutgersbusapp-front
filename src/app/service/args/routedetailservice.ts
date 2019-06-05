import { Injectable } from '@angular/core';
import { Route } from '../../model/route';

@Injectable({
    providedIn: 'root'
})
export class RouteDetailService {

    private data: Route;

    constructor() {}

    public setRoute(route: Route): void { this.data = route; }
    public getRoute(): Route { return this.data; }

}
