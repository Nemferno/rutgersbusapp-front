import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private reminderid: string = null;
    private stopid: string = null;
    private routeid: string = null;
    private actionID: string | null = null;

    constructor() {}

    public setData(reminderid: string, stopid: string, routeid: string, actionID: string | null): void {
        this.reminderid = reminderid;
        this.stopid = stopid;
        this.routeid = routeid;
        this.actionID = actionID;
    }
    public getData(): { reminderid: string, stopid: string, routeid: string, actionID: string } {
        return {
            reminderid: this.reminderid,
            stopid: this.stopid,
            routeid: this.routeid,
            actionID: this.actionID
        };
    }

}
