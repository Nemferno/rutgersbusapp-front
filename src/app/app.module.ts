import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { OneSignal } from '@ionic-native/onesignal/ngx';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { UniNavService } from './service/uni-nav.service';
import { HttpModule } from '@angular/http';
import { RouteDetailService } from './service/args/routedetailservice';
import { StopDetailService } from './service/args/stopdetailservice';
import { StorageService } from './service/storage.service';
import { ReminderComponent } from './reminder/reminder.component';
import { NotificationService } from './service/args/notificationservice';

@NgModule({
    declarations: [AppComponent, ReminderComponent],
    entryComponents: [ReminderComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        AppRoutingModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        UniNavService,
        RouteDetailService,
        StopDetailService,
        OneSignal,
        StorageService,
        LaunchNavigator,
        NotificationService,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
