import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GrupoModificadorModalComponent } from './grupo-modificador-modal.component';
import { GrupoModificador, Modificador } from '../../services/grupo-modificador.service';

describe('GrupoModificadorModalComponent', () => {
  let component: GrupoModificadorModalComponent;
  let fixture: ComponentFixture<GrupoModificadorModalComponent>;

  const mockGrupo: GrupoModificador = {
    id: 'grupo-test-1',
    nombre: 'Test Group',
    descripcion: 'Test Description',
    tipo: 'multiple',
    obligatorio: false,
    estado: 'activo',
    modificadores: [
      { id: 'mod-test-1', nombre: 'Test Modifier', precio: 1.50, estado: 'activo' }
    ],
    maxSelecciones: 3
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoModificadorModalComponent, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GrupoModificadorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.formData.nombre).toBe('');
    expect(component.formData.tipo).toBe('unico');
    expect(component.formData.obligatorio).toBeFalse();
    expect(component.formData.estado).toBe('activo');
    expect(component.formData.modificadores).toEqual([]);
  });

  it('should load existing group data on init', () => {
    component.grupo = mockGrupo;
    component.ngOnInit();
    expect(component.formData.nombre).toBe(mockGrupo.nombre);
    expect(component.formData.descripcion).toBe(mockGrupo.descripcion);
    expect(component.formData.tipo).toBe(mockGrupo.tipo);
  });

  it('should validate form correctly', () => {
    // Formulario vacío debería fallar
    expect(component.validarFormulario()).toBeFalse();
    
    // Llenar datos requeridos
    component.formData.nombre = 'Test';
    component.formData.descripcion = 'Test Description';
    component.formData.modificadores = [{ id: 'mod-test-1', nombre: 'Test', precio: 1.50, estado: 'activo' }];
    
    expect(component.validarFormulario()).toBeTrue();
  });

  it('should validate modifier correctly', () => {
    // Modificador vacío debería fallar
    expect(component.validarModificador()).toBeFalse();
    
    // Llenar datos requeridos
    component.nuevoModificador.nombre = 'Test Modifier';
    component.nuevoModificador.precio = 1.50;
    
    expect(component.validarModificador()).toBeTrue();
  });

  it('should add new modifier', () => {
    const initialCount = component.formData.modificadores?.length || 0;
    
    component.nuevoModificador.nombre = 'New Modifier';
    component.nuevoModificador.precio = 2.00;
    component.nuevoModificador.estado = 'activo';
    
    component.agregarModificador();
    
    expect(component.formData.modificadores?.length).toBe(initialCount + 1);
    expect(component.mostrarFormularioModificador).toBeFalse();
  });

  it('should edit existing modifier', () => {
    component.formData.modificadores = [{ id: 'mod-original', nombre: 'Original', precio: 1.00, estado: 'activo' }];
    
    component.editarModificador(0);
    
    expect(component.editandoModificadorIndex).toBe(0);
    expect(component.nuevoModificador.nombre).toBe('Original');
    expect(component.mostrarFormularioModificador).toBeTrue();
  });

  it('should update existing modifier', () => {
    component.formData.modificadores = [{ id: 'mod-original-2', nombre: 'Original', precio: 1.00, estado: 'activo' }];
    component.editandoModificadorIndex = 0;
    
    component.nuevoModificador.nombre = 'Updated';
    component.nuevoModificador.precio = 2.00;
    
    component.agregarModificador();
    
    expect(component.formData.modificadores[0].nombre).toBe('Updated');
    expect(component.formData.modificadores[0].precio).toBe(2.00);
    expect(component.editandoModificadorIndex).toBeNull();
  });

  it('should remove modifier', () => {
    component.formData.modificadores = [
      { id: 'mod-test-1', nombre: 'Test 1', precio: 1.00, estado: 'activo' },
      { id: 'mod-test-2', nombre: 'Test 2', precio: 2.00, estado: 'activo' }
    ];
    
    const initialCount = component.formData.modificadores.length;
    
    // Simular confirmación
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.eliminarModificador(0);
    
    expect(component.formData.modificadores.length).toBe(initialCount - 1);
  });

  it('should clear modifier form', () => {
    component.nuevoModificador.nombre = 'Test';
    component.nuevoModificador.precio = 1.50;
    
    component.limpiarFormularioModificador();
    
    expect(component.nuevoModificador.nombre).toBe('');
    expect(component.nuevoModificador.precio).toBe(0);
  });

  it('should cancel modifier editing', () => {
    component.editandoModificadorIndex = 0;
    component.mostrarFormularioModificador = true;
    
    component.cancelarEdicionModificador();
    
    expect(component.editandoModificadorIndex).toBeNull();
    expect(component.mostrarFormularioModificador).toBeFalse();
  });

  it('should handle type change correctly', () => {
    component.formData.tipo = 'multiple';
    component.formData.maxSelecciones = 5;
    component.formData.minSelecciones = 1;
    
    component.onTipoChange();
    
    // Al cambiar a tipo único, se deben limpiar las selecciones
    component.formData.tipo = 'unico';
    component.onTipoChange();
    
    expect(component.formData.maxSelecciones).toBeUndefined();
    expect(component.formData.minSelecciones).toBeUndefined();
  });

  it('should emit group saved event', () => {
    spyOn(component.grupoGuardado, 'emit');
    
    component.formData.nombre = 'Test';
    component.formData.descripcion = 'Test Description';
    component.formData.modificadores = [{ id: 'mod-test-final', nombre: 'Test', precio: 1.50, estado: 'activo' }];
    
    component.guardarGrupo();
    
    expect(component.grupoGuardado.emit).toHaveBeenCalled();
  });

  it('should emit modal closed event', () => {
    spyOn(component.modalCerrado, 'emit');
    
    component.cerrarModal();
    
    expect(component.modalCerrado.emit).toHaveBeenCalled();
  });

  it('should get correct modal title', () => {
    component.esEdicion = false;
    expect(component.getTituloModal()).toBe('Nuevo Grupo Modificador');
    
    component.esEdicion = true;
    expect(component.getTituloModal()).toBe('Editar Grupo Modificador');
  });

  it('should get correct save button text', () => {
    component.esEdicion = false;
    expect(component.getBotonGuardarTexto()).toBe('Crear');
    
    component.esEdicion = true;
    expect(component.getBotonGuardarTexto()).toBe('Actualizar');
  });
});
