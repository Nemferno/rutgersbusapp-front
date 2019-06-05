import { Component, OnInit } from '@angular/core';
import { UniNavService } from '../service/uni-nav.service';
import { RouteDetailService } from '../service/args/routedetailservice';
import { Route } from '../model/route';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConfiguration, RouteStop } from '../model/routeconfig';
import { StorageService } from '../service/storage.service';
import { NavController, MenuController } from '@ionic/angular';
import { StopDetailService } from '../service/args/stopdetailservice';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'app-route-detail',
    templateUrl: './route-detail.page.html',
    styleUrls: ['./route-detail.page.scss'],
})
export class RouteDetailPage implements OnInit {

    private times: any[] = [];
    private routeid: string;
    private route: Route;
    private config: RouteConfiguration;

    private refresh$: Subscription;

    constructor(
        private api: UniNavService,
        private routedetailservice: RouteDetailService,
        private params: ActivatedRoute,
        private storage: StorageService,
        private navCtrl: NavController,
        private stopdetailservice: StopDetailService,
        private router: Router,
        private menuCtrl: MenuController
    ) { }

    ngOnInit() {
        this.routeid = this.params.snapshot.paramMap.get('id');
        const route = this.routedetailservice.getRoute();
        this.route = route;

        new Promise((resolve, reject) => {
            this.api.getRouteConfiguration(this.route.routeid)
            .subscribe((data) => {
                this.config = data;
                resolve(data);
            }, (err) => {
                console.error({ error: err, api: 'getRouteConfiguration' });
                this.config = new RouteConfiguration();
                reject(err);
            });
        })
        .then(() => {
            return this.processTimes();
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    ionViewWillEnter() {
        this.menuCtrl.enable(false);
        this.refresh$ = interval(30 * 1000).subscribe(() => this.refresh(null));
    }

    ionViewWillLeave(): void {
        this.menuCtrl.enable(true);
        this.refresh$.unsubscribe();
    }

    back(): void {
        this.navCtrl.goBack(true);
    }

    toStopDetails(stop: RouteStop, index: number): void {
        this.stopdetailservice.setData({
            route: this.config,
            stop: stop,
            time: this.times[index]
        });
        this.router.navigate([ `route/${ this.routeid }/stop/${ stop.stopid }`])
        .catch((err) => {
            console.error({ error: err });
        });
    }

    private processTimes(): Promise<any> {
        return this.storage.getAllRoutes()
        .then((routes) => {
            const stops = this.config.stops.map(e => {
                return e.stopserviceid;
            });

            return new Promise((resolve, reject) => {
                this.api.getTimesForRoute(this.route.routeserviceid)
                .subscribe((data) => {
                    let times = [];
                    for (let i = 0; i < stops.length; i++) {
                        const datastop = data[stops[i]];
                        if (!datastop) {
                            times.push({});
                        } else {
                            const dataroutes = Object.keys(datastop);
                            const payload = dataroutes.map(e => {
                                const sub = routes.find(r => r.routeserviceid === e);
                                return {
                                    routename: sub.routename,
                                    routeserviceid: sub.routeserviceid,
                                    routedirection: sub.direction,
                                    arrivals: datastop[e]
                                };
                            });

                            times = times.concat(payload);
                        }
                    }

                    this.times = times;
                    console.log({ times });
                    resolve(this.times);
                }, (err) => {
                    if (err) {
                        console.error({ error: err });
                        reject(err);
                    }

                    this.times = [];
                    resolve(this.times);
                });
            });
        });
    }

    refresh(event: any): void {
        this.processTimes()
        .then(() => {
            event && event.target.complete();
        })
        .catch(() => {
            event && event.target.complete();
        });
    }

}
