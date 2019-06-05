import { Injectable } from '@angular/core';
import { RouteStop, RouteConfiguration } from '../../model/routeconfig';
import { Route } from '../../model/route';

@Injectable({
    providedIn: 'root'
})
export class StopDetailService {

    private data: { route: RouteConfiguration, stop: RouteStop, time: any };

    constructor() {}

    public setData(stop: { route: RouteConfiguration, stop: RouteStop, time: any }): void { this.data = stop; }
    public getData(): { route: RouteConfiguration, stop: RouteStop, time: any } { return this.data; }

}
