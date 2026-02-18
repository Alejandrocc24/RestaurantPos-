import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 7 menu items', () => {
    expect(component.menuItems.length).toBe(7);
  });

  it('should contain all required menu items', () => {
    const menuNames = component.menuItems.map(item => item.name);
    expect(menuNames).toContain('Mesas');
    expect(menuNames).toContain('Ventas');
    expect(menuNames).toContain('Gastos');
    expect(menuNames).toContain('Productos');
    expect(menuNames).toContain('Pantalla de Cocina');
    expect(menuNames).toContain('Configuración');
  });
});
