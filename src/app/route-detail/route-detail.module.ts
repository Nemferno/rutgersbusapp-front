import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { RouteDetailPage } from './route-detail.page';
import { RouteDetailService } from '../service/args/routedetailservice';

const routes: Routes = [
  {
    path: '',
    component: RouteDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [RouteDetailPage]
})
export class RouteDetailPageModule {}
