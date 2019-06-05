import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { OneSignal } from "@ionic-native/onesignal/ngx";
import { UniNavService } from "./uni-nav.service";
import { CompactStop } from "../model/routeconfig";
import { Route } from "../model/route";

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private isRegistered: boolean;
    private userid: string;

    public mapStyle: any = [
        {
            featureType: "administrative",
            stylers: [
                {
                    visibility: "off",
                },
            ],
        },
        {
            featureType: "landscape",
            stylers: [
                {
                    visibility: "on",
                },
            ],
        },
        {
            featureType: "poi",
            stylers: [
                {
                    visibility: "off",
                },
            ],
        }, {
            featureType: "transit",
            stylers: [
                {
                    visibility: "off",
                },
            ],
        },
    ];

    constructor(
        private storage: Storage,
        private oneSignal: OneSignal
    ) {}

    public registerService(registered: boolean): void {
        this.isRegistered = registered;

        this.storage.set('registered', this.isRegistered)
        .catch((err) => { console.error({ error: err }); });
    }

    public isServerRegistered(persist?: boolean): Promise<boolean> {
        if (persist) {
            return this.storage.get('registered');
        }

        return Promise.resolve(this.isRegistered);
    }

    public storeAllStops(stops: CompactStop[]): Promise<any> {
        return this.storage.set('allstops', JSON.stringify(stops))
        .catch((err) => { console.error({ error: err }); });
    }

    public storeAllRoutes(routes: Route[]): Promise<any> {
        return this.storage.set('allroutes', JSON.stringify(routes))
        .catch((err) => { console.error({ error: err }); });
    }

    public getAllRoutes(): Promise<Route[]> {
        return this.storage.get('allroutes')
        .then((data: any) => {
            return JSON.parse(data) as Route[]
        });
    }

    public getAllStops(): Promise<CompactStop[]> {
        return this.storage.get('allstops')
        .then((data: any) => {
            return JSON.parse(data) as CompactStop[];
        });
    }

    public getUserId(): Promise<string> {
        return this.storage.ready().then(() => this.storage.get('userid')
        .then((data) => {
            console.log({ data });
            if (!data || data.trim() === '') {
                console.log('No user id');
                if (!window.cordova) {
                    this.userid = '951f20f8-65d4-442b-9e43-5940e9096d8a';
                }

                if (!this.userid) {
                    console.log('User Id Does Not Exist');
                    return this.oneSignal.getPermissionSubscriptionState()
                    .then((sub) => {
                        console.log({ sub });
                        this.userid = sub.subscriptionStatus.userId;
                        this.storage.set('userid', this.userid);
                        return this.userid;
                    })
                    .catch((err) => {
                        console.error({ error: err });
                        return '';
                    });
                }
            }

            this.userid = data;
            return Promise.resolve(this.userid);
        }));
    }

}
