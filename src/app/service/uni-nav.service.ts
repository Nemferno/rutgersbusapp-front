import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { map, timeout } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Route } from '../model/route';
import { RouteConfiguration, CompactStop } from '../model/routeconfig';
import { Vehicle } from '../model/vehicle';

@Injectable({
    providedIn: 'root'
})
export class UniNavService {

    private baseUrl = 'https://uninav.herokuapp.com';
    // private baseUrl = 'http://localhost:5000';
    // private baseUrl = 'http://192.168.1.2:5000';
    private relative = '/api/v2/';
    private universityid = 'Rutgers University';

    private readonly map$ = map((res: any) => res.json());
    private readonly timeout$ = timeout(5000);

    constructor(private http: Http) { }

    public registerDevice(userid: string): Observable<any> {
        return this.post('user', { userid });
    }

    public skipBusReminder(userid: string, reminderid: number): Observable<any> {
        return this.put('reminder/' + userid + '/' + reminderid + '/skip', {
            userid: userid,
            reminderid: reminderid
        });
    }

    public createReminder(userid: string, routeid: number, stopid: number, reminderduration: number, startdate: Date): Observable<any> {
        return this.post('reminder', {
            userid: userid,
            routeid: routeid,
            stopid: stopid,
            reminderduration: reminderduration,
            unid: this.universityid,
            startdate: startdate.toISOString()
        });
    }

    public deleteReminder(userid: string, reminderid: number): Observable<any> {
        return this.delete(`reminder/${ userid }/${ reminderid }`);
    }

    public editReminder(userid: string, reminderid: number, duration: number): Observable<any> {
        return this.put(`reminder/${ userid }/${ reminderid }`, { duration });
    }

    public getReminders(userid: string): Observable<any[]> {
        return this.get('reminders?userid=' + userid);
    }

    public getBuses(route: string): Observable<Vehicle[]> {
        return this.get('bus?unid=' + this.universityid + '&route=' + route);
    }

    public getTimesForRoute(route: string): Observable<any> {
        return this.get('times?unid=' + this.universityid + '&routeid=' + route);
    }

    public getTimesForStops(stops: string[]): Observable<any> {
        const joined = stops.join(encodeURIComponent(','));

        return this.get('time?unid=' + this.universityid + '&stopid=' + joined);
    }

    public getTimesForStop(stop: string, route: string): Observable<any> {
        return this.get('time?unid=' + this.universityid + '&routeid=' + route + '&stopid=' + stop);
    }

    public getAllStops(): Observable<CompactStop[]> {
        return this.get('stops?unid=' + this.universityid);
    }

    public getRouteConfiguration(routeid): Observable<RouteConfiguration> {
        return this.get('config?unid=' + this.universityid + '&routeid=' + routeid);
    }

    public getOnlineRoutes(): Observable<Route[]> {
        return this.get('online?unid=' + this.universityid);
    }

    public getRoutes(): Observable<Route[]> {
        return this.get('routes?unid=' + this.universityid);
    }

    private get(url: string): Observable<any> {
        return this.http.get(this.baseUrl + this.relative + url)
        .pipe(this.map$, this.timeout$);
    }

    private put(url: string, payload: any): Observable<any> {
        return this.http.put(this.baseUrl + this.relative + url, payload)
        .pipe(this.map$, this.timeout$);
    }

    private post(url: string, payload: any): Observable<any> {
        return this.http.post(this.baseUrl + this.relative + url, payload)
        .pipe(this.map$, this.timeout$);
    }

    private delete(url: string): Observable<any> {
        return this.http.delete(this.baseUrl + this.relative + url)
        .pipe(this.map$, this.timeout$);
    }

}
