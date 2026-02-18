import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GastoModalComponent } from './gasto-modal.component';

describe('GastoModalComponent', () => {
  let component: GastoModalComponent;
  let fixture: ComponentFixture<GastoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastoModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GastoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
