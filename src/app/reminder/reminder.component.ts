import { Component, OnInit, Input } from '@angular/core';
import { NavParams, ModalController, Platform } from '@ionic/angular';
import { CompactStop, RouteStop } from '../model/routeconfig';
import { Route } from '../model/route';
import { StorageService } from '../service/storage.service';
import { Subscription } from 'rxjs';
import { UniNavService } from '../service/uni-nav.service';

@Component({
    selector: 'app-reminder',
    templateUrl: './reminder.component.html',
    styleUrls: ['./reminder.component.scss']
})
export class ReminderComponent implements OnInit {

    @Input() stop: RouteStop;
    @Input() routeid: number;

    @Input() minutes: number;

    private backSub: any;

    constructor(
        private storage: StorageService,
        private modalCtrl: ModalController,
        private plt: Platform,
        private api: UniNavService
    ) { }

    ngOnInit() {
        this.backSub = this.plt.backButton.subscribeWithPriority(9999, () => { this.modalCtrl.dismiss(); });
    }

    ionViewWillLeave() {
        (<Subscription> this.backSub).unsubscribe();
    }

    private select(minutes: number): void {
        this.minutes = minutes;
    }

    private submit(): void {
        if (!this.minutes) {
            console.error('Must select');
            return;
        }

        this.modalCtrl.dismiss({
            duration: this.minutes
        });
    }

    private cancel(): void {
        this.modalCtrl.dismiss();
    }

}
