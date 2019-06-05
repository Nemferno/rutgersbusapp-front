import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StopDetailPage } from './stop-detail.page';

describe('StopDetailPage', () => {
  let component: StopDetailPage;
  let fixture: ComponentFixture<StopDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StopDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
