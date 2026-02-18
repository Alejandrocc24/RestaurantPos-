import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ProductosComponent } from './productos.component';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductosComponent ],
      imports: [ FormsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar visibility', () => {
    const initialState = component.sidebarVisible;
    component.toggleSidebar();
    expect(component.sidebarVisible).toBe(!initialState);
  });

  it('should filter products by category', () => {
    component.filtrarPorCategoria('Bebidas');
    expect(component.categoriaSeleccionada).toBe('Bebidas');
  });

  it('should change product status', () => {
    const producto = component.productos[0];
    const estadoInicial = producto.estado;
    component.cambiarEstado(producto);
    expect(producto.estado).toBe(estadoInicial === 'activo' ? 'inactivo' : 'activo');
  });
});
