import { Component, OnInit } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { UniNavService } from '../service/uni-nav.service';
import { NavController, ModalController, AlertController } from '@ionic/angular';
import { ReminderComponent } from '../reminder/reminder.component';

@Component({
    selector: 'app-reminders',
    templateUrl: './reminders.page.html',
    styleUrls: ['./reminders.page.scss'],
})
export class RemindersPage implements OnInit {

    private reminders: any[] = [];

    constructor(
        private storage: StorageService,
        private api: UniNavService,
        private navCtrl: NavController,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) { }

    ngOnInit() {
        this.getReminders();
    }

    private getReminders(): Promise<any> {
        return this.storage.getUserId()
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
        .then((reminders: any[]) => {
            this.reminders = reminders;
            return this.reminders;
        })
        .catch((err) => {
            console.error({ error: err });
            this.reminders = [];
            return this.reminders;
        });
    }

    deleteReminder(reminderid: number) {
        this.alertCtrl.create({
            header: 'Confirm Deletion',
            message: 'Are you sure you want to delete this notification?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                },
                {
                    text: 'Delete',
                    handler: () => {
                        this.storage.getUserId()
                        .then((userid: string) => {
                            this.api.deleteReminder(userid, reminderid)
                            .subscribe(() => {}, (err) => console.error(err));
                        });
                    }
                }
            ]
        }).then((alert) => {
            return alert.present();
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    editReminder(reminder: any) {
        this.modalCtrl.create({
            component: ReminderComponent,
            componentProps: {
                stop: { 
                    stopname: reminder.stopname
                },
                routeid: reminder.routeid,
                minutes: reminder.reminderduration
            }
        })
        .then((modal) => {
            modal.present();
            return modal.onDidDismiss();
        })
        .then((data) => {
            if (!data.data) { return null; }

            const { duration } = data.data;
            if (duration !== reminder.reminderduration) {
                return this.storage.getUserId()
                .then((userid) => {
                    this.api.editReminder(userid, reminder.reminderid, duration)
                    .subscribe(() => {}, (err) => console.error(err));
                });
            }
        })
        .catch((err) => {
            console.error({ error: err });
        });
    }

    back(): void {
        this.navCtrl.goBack(true);
    }

    refresh(event: any): void {
        this.getReminders()
        .then(() => {
            event.target.complete();
        });
    }

}
