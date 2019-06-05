import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteDetailPage } from './route-detail.page';

describe('RouteDetailPage', () => {
  let component: RouteDetailPage;
  let fixture: ComponentFixture<RouteDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
