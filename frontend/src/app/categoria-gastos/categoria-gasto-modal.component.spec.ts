import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriaGastoModalComponent } from './categoria-gasto-modal.component';

describe('CategoriaGastoModalComponent', () => {
  let component: CategoriaGastoModalComponent;
  let fixture: ComponentFixture<CategoriaGastoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaGastoModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategoriaGastoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
