import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigFacturaComponent } from './config-factura.component';

describe('ConfigFacturaComponent', () => {
  let component: ConfigFacturaComponent;
  let fixture: ComponentFixture<ConfigFacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigFacturaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
