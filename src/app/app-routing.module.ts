import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'load', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'load', loadChildren: './load/load.module#LoadPageModule' },
  { path: 'route/:id', loadChildren: './route-detail/route-detail.module#RouteDetailPageModule' },
  { path: 'route/:id/stop/:stopid', loadChildren: './stop-detail/stop-detail.module#StopDetailPageModule' },
  { path: 'reminders', loadChildren: './reminders/reminders.module#RemindersPageModule' },
  { path: 'settings', loadChildren: './settings/settings.module#SettingsPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
