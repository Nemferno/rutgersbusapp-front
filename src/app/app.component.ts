import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { OneSignal } from '@ionic-native/onesignal/ngx';
import { StorageService } from './service/storage.service';
import { UniNavService } from './service/uni-nav.service';
import { NotificationService } from './service/args/notificationservice';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})
export class AppComponent {
    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private onesignal: OneSignal,
        private notificationService: NotificationService
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            if (window.cordova) {
                this.statusBar.styleDefault();
                this.splashScreen.hide();

                this.onesignal.registerForPushNotifications();
                this.onesignal.setRequiresUserPrivacyConsent(true);
                this.onesignal.provideUserConsent(true);
                this.onesignal.startInit('396bf52d-258d-4ca7-8cb1-6f951ab3d0f5', '547764593912');
                this.onesignal.inFocusDisplaying(this.onesignal.OSInFocusDisplayOption.Notification);
                this.onesignal.handleNotificationOpened().subscribe((data) => {
                    const { reminderid, stopid, routeid } = data.notification.payload.additionalData;
                    const { actionID } = data.action;
                    this.notificationService.setData(reminderid, stopid, routeid, actionID);
                });
                this.onesignal.handleNotificationReceived().subscribe((data) => {});
                this.onesignal.endInit();
            } else {
                console.log('In browser mode');
            }
        });
    }
}
