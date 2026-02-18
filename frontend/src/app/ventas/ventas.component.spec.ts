import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasComponent } from './ventas.component';
import { VentasService } from '../services/ventas.service';
import { of } from 'rxjs';

describe('VentasComponent', () => {
  let component: VentasComponent;
  let fixture: ComponentFixture<VentasComponent>;
  let mockVentasService: jasmine.SpyObj<VentasService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('VentasService', [
      'getRecaudoActual',
      'getMesasCerradas',
      'getGastos',
      'getEstadisticasProductos'
    ]);

    await TestBed.configureTestingModule({
      imports: [VentasComponent],
      providers: [
        { provide: VentasService, useValue: spy }
      ]
    }).compileComponents();

    mockVentasService = TestBed.inject(VentasService) as jasmine.SpyObj<VentasService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VentasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentView).toBe('recaudo');
    expect(component.recaudoActual).toBe(0);
    expect(component.ventasHoy).toBe(0);
    expect(component.promedioTicket).toBe(0);
  });

  it('should change view when cambiarVista is called', () => {
    component.cambiarVista('mesas');
    expect(component.currentView).toBe('mesas');
  });

  it('should calculate total recaudado from mesas', () => {
    component.mesasCerradas = [
      { id: 1, mesaId: 1, mesaNumero: 'Mesa 1', horaApertura: '12:00', horaCierre: '14:30', total: 45.50, estado: 'cerrada', fecha: '2024-01-15', productos: [] },
      { id: 2, mesaId: 2, mesaNumero: 'Mesa 2', horaApertura: '13:00', horaCierre: '15:00', total: 67.80, estado: 'cerrada', fecha: '2024-01-15', productos: [] }
    ];
    
    const total = component.getTotalRecaudadoMesas();
    expect(total).toBe(113.30);
  });

  it('should calculate total productos vendidos', () => {
    component.productosVendidos = [
      { id: 1, nombre: 'Helado', cantidad: 10, precio: 3.50, total: 35.00, categoria: 'helados' },
      { id: 2, nombre: 'Batido', cantidad: 5, precio: 4.50, total: 22.50, categoria: 'batidos' }
    ];
    
    const total = component.getTotalProductosVendidos();
    expect(total).toBe(15);
  });
});
