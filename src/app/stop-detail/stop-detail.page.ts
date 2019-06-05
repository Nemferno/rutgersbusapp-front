import { Component, OnInit, AfterViewInit } from '@angular/core';
import {} from 'googlemaps';
import { UniNavService } from '../service/uni-nav.service';
import { StopDetailService } from '../service/args/stopdetailservice';
import { ActivatedRoute } from '@angular/router';
import { NavController, MenuController, ModalController } from '@ionic/angular';
import { RouteStop, RouteConfiguration } from '../model/routeconfig';
import { Route } from '../model/route';
import { Vehicle } from '../model/vehicle';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';

import * as GeoHash from 'latlon-geohash';
import { ReminderComponent } from '../reminder/reminder.component';
import { StorageService } from '../service/storage.service';
import { Subscription, interval } from 'rxjs';

BusInfoOverlay.prototype = new google.maps.OverlayView;
function BusInfoOverlay(map) {
    this.map_ = map;

    this.vName = '';
    this.speed = 0;
    this.capacity = 0;
    this.div_ = null;
    this.name_ = null;
    this.speed_ = null;
    this.capacity_ = null;
    this.setMap(map);
}
BusInfoOverlay.prototype.onAdd = function() {
    const div = document.createElement('div');
    div.style.borderStyle = 'none';
    div.style.position = 'absolute';
    div.style.width = '100px';
    div.style.transform = 'translateX(-50px)';
    div.style.color = 'black';
    div.style.backgroundColor = 'white';
    div.style.zIndex = '1100';
    div.style.display = 'flex';
    div.style.flexDirection = 'row';
    div.style.alignContent = 'center';
    div.style.alignItems = 'center';
    div.style.fontSize = '13px';
    div.style.fontWeight = 'bold';
    div.style.color = 'rgb(76, 66, 93)';
    div.style.padding = '4px';
    div.style.borderRadius = '10px';
    div.style.boxShadow = 'black 0 0 5px';

    const name = document.createElement('div');
    name.style.width = '100%';
    name.style.marginRight = '5px';
    name.innerHTML = `#${ this.vName }`;
    div.appendChild(name);

    const _div = document.createElement('div');
    _div.style.borderRight = '1px solid currentColor';
    _div.style.borderLeft = '1px solid currentColor';
    _div.style.textAlign = 'center';
    _div.style.width = '100%';
    _div.style.fontSize = '8px';

    const speed = document.createElement('div');
    speed.innerHTML = `${ this.speed }`;
    _div.appendChild(speed);
    const mph = document.createElement('div');
    mph.innerHTML = 'mph';
    _div.appendChild(mph);
    div.appendChild(_div);

    const capacity = document.createElement('div');
    capacity.innerHTML = `${ this.capacity }%`;
    capacity.style.marginLeft = '5px';
    capacity.style.textAlign = 'center';
    div.appendChild(capacity);

    this.capacity_ = capacity;
    this.speed_ = speed;
    this.name_ = name;
    this.div_ = div;
    const panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
};
BusInfoOverlay.prototype.draw = function() {
    const overlayProject = this.getProjection();
    const pt = overlayProject.fromLatLngToDivPixel(this.position_);

    const div = this.div_;
    div.style.left = pt.x + 'px';
    div.style.top = (pt.y - 50) + 'px';

    this.capacity_.innerHTML = `${ this.capacity }%`;
    this.speed_.innerHTML = `${ this.speed }`;
    this.name_.innerHTML = `#${ this.vName }`;
};
BusInfoOverlay.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
};
// @ts-ignore
BusInfoOverlay.prototype.setVehicle = function(vehicle) {
    this.position_ = new google.maps.LatLng(vehicle.lat, vehicle.lon);
    this.vName = vehicle.name;
    this.speed = vehicle.speed.toFixed(0);
    this.capacity = (vehicle.capacity * 100).toFixed(0);
};

@Component({
    selector: 'app-stop-detail',
    templateUrl: './stop-detail.page.html',
    styleUrls: ['./stop-detail.page.scss'],
})
export class StopDetailPage implements OnInit, AfterViewInit {

    private map: google.maps.Map;
    private routePath: google.maps.Polyline;
    private stopMarker: google.maps.Marker;
    private busMarker: google.maps.Marker;

    private stopid: string;
    private routeid: string;

    private vehicles: Vehicle[];
    private times: any;
    private stop: RouteStop;
    private route: RouteConfiguration;

    private selected = 0;

    private refresh$: Subscription;

    private infowindow: any;

    private hasReminder: boolean;
    private id: number;

    constructor(
        private api: UniNavService,
        private stopdetailservice: StopDetailService,
        private params: ActivatedRoute,
        private navCtrl: NavController,
        private menuCtrl: MenuController,
        private modalCtrl: ModalController,
        private navigator: LaunchNavigator,
        private storage: StorageService
    ) { }

    ngOnInit() {
        const { stop, route, time } = this.stopdetailservice.getData();
        this.stop = stop;
        this.route = route;
        this.times = time;

        this.stopid = this.params.snapshot.paramMap.get('stopid');
        this.routeid = this.params.snapshot.paramMap.get('id');
    }

    ionViewWillEnter() {
        this.menuCtrl.enable(false);
        this.refresh$ = interval(30 * 1000).subscribe(() => this.refresh(null));

        // get reminders and find if a reminder exists for this stop
        this.storage.getUserId()
        .then((userid) => {
            return new Promise((resolve, reject) => {
                this.api.getReminders(userid)
                .subscribe((reminders) => {
                    resolve(reminders);
                }, (err) => {
                    reject(err);
                });
            });
        })
        .then((reminders) => {

        })
        .catch((err) => {
            if (err) {
                console.error({ error: err });
                return;
            }

            this.hasReminder = false;
        });
    }

    ionViewWillLeave() {
        this.menuCtrl.enable(true);
        this.refresh$.unsubscribe();
    }

    updateReminder(): void {
        
    }

    ngAfterViewInit() {
        this.map = new google.maps.Map(document.getElementById('map'), {
            disableDefaultUI: true,
            zoom: 10,
            center: { lat: 40.502899, lng: -74.451658 },
            styles: this.storage.mapStyle
        });

        let path = [];
        for (let i = 0; i < this.route.segments.length; i++) {
            const segment = this.route.segments[i];
            const decode = google.maps.geometry.encoding.decodePath(segment);
            path = path.concat(decode);
            path.push(decode[0]);
        }

        this.routePath = new google.maps.Polyline({
            map: this.map,
            path: path,
            strokeColor: '#D80000',
            strokeWeight: 2,
            strokeOpacity: 1,
            geodesic: true,
            visible: true,
            zIndex: 800
        });

        // proceed to get the bus api
        this.getVehicles()
        .then(() => {
            // get stop
            const stoppos = GeoHash.decode(this.stop.coord);

            this.stopMarker = new google.maps.Marker({
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'white',
                    fillOpacity: 1.0,
                    strokeColor: '#D80000',
                    strokeWeight: 2,
                    scale: 4
                },
                position: { lat: stoppos.lat, lng: stoppos.lon },
                map: this.map,
                zIndex: 900,
                visible: true
            });

            const bounds = new google.maps.LatLngBounds();
            bounds.extend(this.stopMarker.getPosition());
            if (this.busMarker) { bounds.extend(this.busMarker.getPosition()); }
            this.map.fitBounds(bounds);
            this.map.setZoom(this.map.getZoom() - 2);
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    private processTimes(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.getTimesForStop(this.stop.stopserviceid, this.route.routeserviceid)
            .subscribe((data) => {
                let arrivals = [];
                if (data[this.stop.stopserviceid]) {
                    arrivals = data[this.stop.stopserviceid][this.route.routeserviceid];
                }

                this.times = {
                    routename: this.route.routename,
                    routeserviceid: this.route.routeserviceid,
                    routedirection: this.route.direction,
                    arrivals: arrivals
                };

                resolve(this.times);
            }, (err) => reject(err));
        });
    }

    private go(): void {
        if (!window.cordova) { return; }

        const coord = GeoHash.decode(this.stop.coord);
        this.navigator.navigate([ coord.lat, coord.lon ], {
            destinationName: this.stop.stopname,
        });
    }

    private async openReminder(): Promise<any> {
        this.modalCtrl.create({
            component: ReminderComponent,
            componentProps: {
                stop: this.stop,
                routeid: this.route.routeid
            }
        })
        .then((modal) => {
            modal.present();
            return modal.onDidDismiss();
        })
        .then((data) => {
            if (!data.data) { return null; }

            const { duration } = data.data;
            const date = new Date();
            return this.storage.getUserId()
            .then((userid) => {
                return new Promise((resolve, reject) => {
                    this.api.createReminder(userid, this.route.routeid, this.stop.stopid, duration, date)
                    .subscribe(() => {
                        resolve();
                    }, (err) => {
                        reject(err);
                    });
                });
            });
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    private getVehicles(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.getBuses(this.route.routeserviceid)
            .subscribe((vehicles) => {
                this.vehicles = vehicles;
                resolve(vehicles);
            }, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve([]);
            });
        })
        .then((vehicles: Vehicle[]) => {
            this.updateMarker(vehicles);
        });
    }

    private updateMarker(vehicles: Vehicle[]): void {
        if (!this.times || this.times.arrivals.length === 0) { return null; }

        const selected = this.times.arrivals[this.selected];
        const id = Number.parseInt(selected.bus, 10);
        const bus = vehicles.find(e => e.id === id);
        if (bus) {
            if (this.busMarker) {
                this.busMarker.setIcon({
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    fillColor: 'red',
                    fillOpacity: 1.0,
                    strokeWeight: 2,
                    scale: 4,
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 2.6),
                    rotation: bus.heading
                });
                this.busMarker.setPosition({ lat: bus.lat, lng: bus.lon });
                if (this.busMarker.getVisible()) { this.busMarker.setVisible(true); }
                (<any> this.infowindow).setVehicle(bus);
                this.infowindow.draw();
            } else {
                this.busMarker = new google.maps.Marker({
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        fillColor: 'red',
                        fillOpacity: 1.0,
                        strokeWeight: 2,
                        scale: 4,
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(0, 2.6),
                        rotation: bus.heading
                    },
                    position: { lat: bus.lat, lng: bus.lon },
                    map: this.map,
                    zIndex: 1000,
                    visible: true
                });
                this.infowindow = new BusInfoOverlay(this.map);
                (<any> this.infowindow).setVehicle(bus);
            }
        } else {
            console.error('Could not obtain the bus');
            if (this.busMarker) { this.busMarker.setVisible(false); }
        }
    }

    private refresh($event): void {
        this.processTimes()
        .then(() => {
            return this.getVehicles();
        })
        .then(() => {
            $event && $event.target.complete();
        })
        .catch((err) => {
            console.error({ error: err });
            $event && $event.target.complete();
        });
    }

    select(index: number): void {
        this.selected = index;
        this.updateMarker(this.vehicles);

        if (this.busMarker) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(this.stopMarker.getPosition());
            if (this.busMarker) { bounds.extend(this.busMarker.getPosition()); }
            this.map.fitBounds(bounds);
            this.map.setZoom(this.map.getZoom() - 2);
        }
    }

    back(): void {
        this.navCtrl.goBack(true);
    }

}
