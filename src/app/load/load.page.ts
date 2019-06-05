import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';
import { UniNavService } from '../service/uni-nav.service';
import { StorageService } from '../service/storage.service';

import * as async from 'async';
import { CompactStop } from '../model/routeconfig';
import { Route } from '../model/route';
import { MenuController, Platform } from '@ionic/angular';
import { OneSignal } from '@ionic-native/onesignal/ngx';
import { NotificationService } from '../service/args/notificationservice';

@Component({
    selector: 'app-load',
    templateUrl: './load.page.html',
    styleUrls: ['./load.page.scss'],
    animations: [
        trigger('rotation', [
            state('edu', style({
                transform: 'rotate(0)'
            })),
            state('bus', style({
                transform: 'rotate(360deg)'
            })),
            transition('edu => bus', animate('200ms ease-out')),
            transition('bus => edu', animate('200ms ease-out'))
        ])
    ]
})
export class LoadPage implements OnInit, OnDestroy {

    private iconInterval: number;
    private currentIconName = 'bus';

    private percent: number;
    private queue: Array<Function>;

    constructor(
        private router: Router,
        private api: UniNavService,
        private storage: StorageService,
        private menuCtrl: MenuController,
        private plt: Platform
    ) {}

    ngOnInit() {
        this.queue = [
            () => {
                console.log('Obtaining User Id');
                return this.storage.getUserId();
            },
            () => {
                return this.storage.isServerRegistered(true)
                .then((isRegistered) => {
                    if (!isRegistered) {
                        return this.storage.getUserId()
                        .then((userid) => {
                            return new Promise((resolve, reject) => {
                                this.api.registerDevice(userid)
                                .subscribe((data) => {
                                    resolve(data);
                                }, (err) => {
                                    reject(err);
                                });
                            });
                        })
                        .then((res: any) => {
                            if (res.success) {
                                console.log('register successful');
                                this.storage.registerService(res.success);
                            }

                            return true;
                        });
                    }

                    return Promise.resolve(true);
                });
            },
            () => {
                return new Promise((resolve, reject) => {
                    this.api.getRoutes()
                    .subscribe((data) => {
                        resolve(data);
                    }, (err) => {
                        reject(err);
                    });
                })
                .then((data: Route[]) => {
                    if (data) {
                        return this.storage.storeAllRoutes(data);
                    } else {
                        return Promise.resolve();
                    }
                });
            },
            () => {
                return new Promise((resolve, reject) => {
                    this.api.getAllStops()
                    .subscribe((data) => {
                        resolve(data);
                    }, (err) => {
                        reject(err);
                    });
                })
                .then((data: CompactStop[]) => {
                    if (data) {
                        return this.storage.storeAllStops(data);
                    } else {
                        return Promise.resolve();
                    }
                });
            }
        ];

        this.menuCtrl.enable(false);

        this.iconInterval = window.setInterval(() => {
            this.currentIconName = (this.currentIconName === 'bus') ? 'school' : 'bus';
        }, 3000);

        const margin = 100.0 / this.queue.length;
        this.percent = 0.0;

        this.plt.ready()
        .then(() => {
            async.forEachSeries(this.queue, (item, cb) => {
                item()
                .then(() => {
                    console.log('complete');
                    this.percent += margin;
                    cb();
                })
                .catch((err) => {
                    console.error({ error: err });
                    this.percent += margin;
                    cb();
                });
            }, (err) => {
                if (err) { console.error({ error: err }); }

                if (Math.ceil(this.percent) >= 100) {
                    this.router.navigate([ '/home' ])
                    .catch((error) => {
                        console.error({ error: error });
                    });
                }
            });
        });
    }

    ionViewWillLeave(): void {
        this.menuCtrl.enable(true);
    }

    ngOnDestroy() {
        window.clearInterval(this.iconInterval);
    }

}
