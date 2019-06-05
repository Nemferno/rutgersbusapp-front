import { Component, OnInit } from '@angular/core';
import { UniNavService } from '../service/uni-nav.service';
import { Route } from '../model/route';
import { Router } from '@angular/router';
import { RouteDetailService } from '../service/args/routedetailservice';
import { Plugins } from '@capacitor/core';
import { StorageService } from '../service/storage.service';
import * as GeoHash from 'latlon-geohash';
import * as async from 'async';
import { Distance } from '../util/distance';
import { Platform, ModalController, ToastController } from '@ionic/angular';
import { Subscription, interval, timer } from 'rxjs';
import { ReminderComponent } from '../reminder/reminder.component';
import { StopDetailService } from '../service/args/stopdetailservice';
import { RouteStop, RouteConfiguration } from '../model/routeconfig';
import { NotificationService } from '../service/args/notificationservice';

const { Geolocation } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

    private closeStops: { stopid: number, stopname: string, stopserviceids: string[], coord: string, distance: number, time: any[] }[];
    private activeroutes: Route[];

    private backSub: any;
    private refresh$: Subscription;
    private geo$: Subscription;

    constructor(
        private api: UniNavService,
        private router: Router,
        private routedetailservice: RouteDetailService,
        private storage: StorageService,
        private plt: Platform,
        private stopdetailservice: StopDetailService,
        private toastCtrl: ToastController,
        private notificationservice: NotificationService
    ) {}

    ionViewWillLeave() {
        (<Subscription> this.backSub).unsubscribe();
        this.refresh$.unsubscribe();
        this.geo$ && this.geo$.unsubscribe();
    }

    ionViewWillEnter() {
        this.refresh$ = interval(30 * 1000).subscribe(() => this.refresh(null));
        if (window.cordova) {
            this.plt.ready()
            .then(() => {
                this.geo$ = timer(10 * 1000).subscribe(() => {
                    Geolocation.getCurrentPosition({
                        enableHighAccuracy: true,
                        timeout: 15000
                    })
                    .then((coord) => {
                        const lat = coord.coords.latitude;
                        const lon = coord.coords.longitude;
                        return { lat, lon };
                    })
                    .then((coord) => {
                        const { lat, lon } = coord;
                        return this.storage.getAllStops()
                        .then((stops) => {
                            return this.storage.getAllRoutes()
                            .then((routes) => {
                                return { stops, routes };
                            });
                        })
                        .then((data2) => {
                            const { stops, routes } = data2;

                            const sorted = stops.map(stop => {
                                const point = GeoHash.decode(stop.coord[0]);
                                const distance = Distance.distance(lat, lon, point.lat, point.lon);
                                return {
                                    stopid: stop.stopid,
                                    stopname: stop.stopname,
                                    stopserviceid: stop.stopserviceid,
                                    distance: distance,
                                    coord: stop.coord,
                                    time: []
                                };
                            });
                            const temp = sorted.filter(e => e.distance <= 0.15).sort((a, b) => a.distance - b.distance);
                            const array = [];
                            for (let i = 0; i < temp.length; i++) {
                                const item = temp[i];
                                const name = item.stopname; // .replace(/\s*\(.+\)\s*/g, '');
                                const found = array.find(e => e.stopname === name);
                                if (!found) {
                                    array.push({
                                        stopid: item.stopid,
                                        stopname: name,
                                        stopserviceids: [ item.stopserviceid ],
                                        distance: item.distance,
                                        coord: item.coord,
                                        time: []
                                    });
                                } else {
                                    found.stopserviceids.push(item.stopserviceid);
                                }
                            }

                            this.closeStops = array;
                            if (!array) { throw new Error('array is null'); }

                            // get times for each stop
                            async.map(array, (item, cb) => {
                                this.api.getTimesForStops(item.stopserviceids)
                                .subscribe((times) => {
                                    return cb(null, times);
                                }, (err) => {
                                    if (err) {
                                        return cb(err, null);
                                    }

                                    return cb(null, null);
                                });
                            }, (err, results) => {
                                if (err) {
                                    console.error({ error: err });
                                    return;
                                }

                                for (let i = 0; i < results.length; i++) {
                                    const result = results[i];
                                    if (!result) { continue; }

                                    const datastops = Object.keys(result);
                                    for (let j = 0; j < datastops.length; j++) {
                                        const dataroutes = Object.keys(result[datastops[j]]);
                                        const payload = dataroutes.map(e => {
                                            const route = routes.find(r => r.routeserviceid === e);
                                            return {
                                                routeid: route.routeid,
                                                routename: route.routename,
                                                routeserviceid: route.routeserviceid,
                                                routedirection: route.direction,
                                                arrivals: result[datastops[j]][e]
                                            };
                                        });

                                        const found = this.closeStops[i];
                                        if (found) {
                                            found.time = found.time.concat(payload);
                                        }
                                    }
                                }
                            });
                        });
                    })
                    .catch((err) => {
                        console.error({ error: err });
                        this.closeStops = [];
                    });
                });
            });
        }

        const { reminderid, routeid, stopid, actionID } = this.notificationservice.getData();
        if (actionID === '0') {
            this.storage.getUserId()
            .then((userid) => {
                return new Promise((resolve, reject) => {
                    this.api.skipBusReminder(userid, Number.parseInt(reminderid, 10))
                    .subscribe((data) => {
                        resolve(data.success);
                    }, (err) => reject(err));
                });
            })
            .catch((err) => {
                console.error({ error: err });
            });
            this.notificationservice.setData(null, null, null, null);
        } else if (routeid !== null) {
            this.router.navigate([ '/route/' + routeid + '/' + stopid ])
            .catch((error) => {
                console.error({ error: error });
            });
            this.notificationservice.setData(null, null, null, null);
        }
    }

    ngOnInit() {
        this.backSub = this.plt.backButton.subscribeWithPriority(9999, () => {});

        this.refresh(null);

        this.closeStops = [];
        if (!window.cordova) {
            // mimic geolocation
            const lat = 40.503357;
            const lon = -74.451344;

            this.storage.getAllStops()
            .then((stops) => {
                return this.storage.getAllRoutes()
                .then((routes) => {
                    return { stops, routes };
                });
            })
            .then((data) => {
                const { stops, routes } = data;

                const sorted = stops.map(stop => {
                    const point = GeoHash.decode(stop.coord[0]);
                    const distance = Distance.distance(lat, lon, point.lat, point.lon);
                    return {
                        stopid: stop.stopid,
                        stopname: stop.stopname,
                        stopserviceid: stop.stopserviceid,
                        distance: distance,
                        coord: stop.coord,
                        time: []
                    };
                });
                const temp = sorted.filter(e => e.distance <= 0.15).sort((a, b) => a.distance - b.distance);
                const array = [];
                for (let i = 0; i < temp.length; i++) {
                    const item = temp[i];
                    const name = item.stopname; // .replace(/\s*\(.+\)\s*/g, '');
                    const found = array.find(e => e.stopname === name);
                    if (!found) {
                        array.push({
                            stopid: item.stopid,
                            stopname: name,
                            stopserviceids: [ item.stopserviceid ],
                            distance: item.distance,
                            coord: item.coord,
                            time: []
                        });
                    } else {
                        found.stopserviceids.push(item.stopserviceid);
                    }
                }

                this.closeStops = array;
                if (!array) { throw new Error('array is null'); }

                // get times for each stop
                async.map(array, (item, cb) => {
                    this.api.getTimesForStops(item.stopserviceids)
                    .subscribe((times) => {
                        return cb(null, times);
                    }, (err) => {
                        if (err) {
                            return cb(err, null);
                        }

                        return cb(null, null);
                    });
                }, (err, results) => {
                    if (err) {
                        console.error({ error: err });
                        return;
                    }

                    for (let i = 0; i < results.length; i++) {
                        const result = results[i];
                        if (!result) { continue; }

                        const datastops = Object.keys(result);
                        for (let j = 0; j < datastops.length; j++) {
                            const dataroutes = Object.keys(result[datastops[j]]);
                            const payload = dataroutes.map(e => {
                                const route = routes.find(r => r.routeserviceid === e);
                                return {
                                    routeid: route.routeid,
                                    routename: route.routename,
                                    routeserviceid: route.routeserviceid,
                                    routedirection: route.direction,
                                    arrivals: result[datastops[j]][e]
                                };
                            });

                            const found = this.closeStops[i];
                            if (found) {
                                found.time = found.time.concat(payload);
                            }
                        }
                    }
                });
            })
            .catch((err) => {
                console.log({ error: err });
                this.closeStops = [];
            });
        }
    }

    toStopDetails(index: number, subindex: number): void {
        new Promise((resolve, reject) => {
            const closestop = this.closeStops[index];
            if (!closestop) { return reject(new Error('No stop with index exists')); }

            const routestop = closestop.time[subindex];
            if (!routestop) { return reject(new Error('No route with index exists')); }

            this.api.getRouteConfiguration(routestop.routeid)
            .subscribe((_config) => {
                resolve(_config);
            }, (err) => {
                reject(err);
            });
        })
        .then((config: RouteConfiguration) => {
            const { stopid, coord, distance, stopname, stopserviceids, time } = this.closeStops[index];
            const substop = time[subindex];

            this.stopdetailservice.setData({
                route: config,
                stop: { stopid, stopname, stopserviceid: stopserviceids[0], coord: coord[0] } as RouteStop,
                time: time[subindex]
            });
            return this.router.navigate([ `route/${ substop.routeid }/stop/${ stopid }`]);
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    toDetails(route: Route): void {
        this.routedetailservice.setRoute(route);
        this.router.navigate([ `route/${ route.routeid }` ])
        .catch((err) => {
            console.error({ error: err });
        });
    }

    refresh(event: any): void {
        this.api.getOnlineRoutes()
        .subscribe((data) => {
            this.activeroutes = data;
            this.activeroutes.sort((a, b) => a.routename.localeCompare(b.routename));

            event && event.target.complete();
        }, (err) => {
            console.error({ error: err, api: 'getOnlineRoutes' });
            this.activeroutes = [];
            event && event.target.complete();
        });
    }

}
